import * as fs from 'fs';

const hexExtractRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export function readFileString(path: string): string {
	return fs.readFileSync(path).toString();
}

export function rgb100ToHex(colors: string[]): string {
	let hexString = '#';
	for (const color of colors) {
		const component = Math.floor((Number.parseInt(color, 10) / 100.0) * 255).toString(16);
		hexString += component.length === 1 ? `0${component}` : component;
	}
	return hexString;
}

export type RgbColor = {
	r: number;
	g: number;
	b: number;
};

export function hexToRgb(color: string): RgbColor | undefined {
	const colors = hexExtractRegex.exec(color);
	return colors
		? {
				r: Number.parseInt(colors[1], 16),
				g: Number.parseInt(colors[2], 16),
				b: Number.parseInt(colors[3], 16),
			}
		: undefined;
}

type LabColor = {
	L: number;
	a: number;
	b: number;
};

function srgbChannelToLinear(channel: number): number {
	const c = channel / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function labPivot(t: number): number {
	return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

// Convert sRGB (0-255) to CIELAB using the D65 reference white.
function rgbToLab(color: RgbColor): LabColor {
	const r = srgbChannelToLinear(color.r);
	const g = srgbChannelToLinear(color.g);
	const b = srgbChannelToLinear(color.b);

	// Linear sRGB -> XYZ (D65), then normalize by the D65 white point.
	const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
	const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
	const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

	const fx = labPivot(x);
	const fy = labPivot(y);
	const fz = labPivot(z);

	return {
		L: 116 * fy - 16,
		a: 500 * (fx - fy),
		b: 200 * (fy - fz),
	};
}

// Perceptual color difference (CIEDE2000) between two sRGB colors.
// Larger values mean the colors look more different; ~2.3 is the
// "just noticeable difference" threshold.
export function getPerceptualColorDelta(
	color1: RgbColor,
	color2: RgbColor,
): number {
	const lab1 = rgbToLab(color1);
	const lab2 = rgbToLab(color2);

	const toDeg = (rad: number) => (rad * 180) / Math.PI;
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	const avgL = (lab1.L + lab2.L) / 2;

	const c1 = Math.hypot(lab1.a, lab1.b);
	const c2 = Math.hypot(lab2.a, lab2.b);
	const avgC = (c1 + c2) / 2;

	const g = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));

	const a1p = lab1.a * (1 + g);
	const a2p = lab2.a * (1 + g);

	const c1p = Math.hypot(a1p, lab1.b);
	const c2p = Math.hypot(a2p, lab2.b);
	const avgCp = (c1p + c2p) / 2;

	const h1p = ((toDeg(Math.atan2(lab1.b, a1p)) % 360) + 360) % 360;
	const h2p = ((toDeg(Math.atan2(lab2.b, a2p)) % 360) + 360) % 360;

	const deltaLp = lab2.L - lab1.L;
	const deltaCp = c2p - c1p;

	let deltahp = 0;
	if (c1p * c2p !== 0) {
		const diff = h2p - h1p;
		if (Math.abs(diff) <= 180) {
			deltahp = diff;
		} else if (diff > 180) {
			deltahp = diff - 360;
		} else {
			deltahp = diff + 360;
		}
	}
	const deltaHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(toRad(deltahp) / 2);

	let avgHp = h1p + h2p;
	if (c1p * c2p !== 0) {
		if (Math.abs(h1p - h2p) > 180) {
			avgHp += h1p + h2p < 360 ? 360 : -360;
		}
		avgHp /= 2;
	}

	const t =
		1 -
		0.17 * Math.cos(toRad(avgHp - 30)) +
		0.24 * Math.cos(toRad(2 * avgHp)) +
		0.32 * Math.cos(toRad(3 * avgHp + 6)) -
		0.2 * Math.cos(toRad(4 * avgHp - 63));

	const sl = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
	const sc = 1 + 0.045 * avgCp;
	const sh = 1 + 0.015 * avgCp * t;

	const deltaTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
	const rc = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
	const rt = -rc * Math.sin(toRad(2 * deltaTheta));

	return Math.sqrt(
		(deltaLp / sl) ** 2 +
			(deltaCp / sc) ** 2 +
			(deltaHp / sh) ** 2 +
			rt * (deltaCp / sc) * (deltaHp / sh),
	);
}

export function getColorDelta(color1: RgbColor, color2: RgbColor): RgbColor {
	return {
		r: color1.r - color2.r,
		g: color1.g - color2.g,
		b: color1.b - color2.b,
	};
}

export function findClosestColorVar(
	targetColor: RgbColor,
	colorMap: Map<RgbColor, string>,
): { var: string; foundColor: RgbColor; delta: number } {
	let minimumDelta = Number.POSITIVE_INFINITY;
	let closestColorVar = '';
	let closestColor = targetColor;
	for (const [colorRgb, colorVar] of colorMap) {
		const delta = getPerceptualColorDelta(targetColor, colorRgb);
		if (delta < minimumDelta) {
			minimumDelta = delta;
			closestColorVar = colorVar;
			closestColor = colorRgb;
		}
	}
	return {
		var: closestColorVar,
		foundColor: closestColor,
		delta: minimumDelta,
	};
}

export function isDefined(val: unknown): boolean {
	return !(val === undefined || val === null);
}

export function invertColorName(color: string) {
	if (color.includes('light')) {
		return color.replace('light', 'dark');
	}

	return color.replace('dark', 'light');
}
