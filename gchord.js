// abc2svg - gchord.js - guitar chords
//
// Copyright (C) 2014-2016 Jean-Francois Moine
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.");

/* -- parse a guitar chord / annotation -- */
// the result is added in the global variable a_gch
// 'type' may be a single '"' or a string '"xxx"' created by U:
function parse_gchord(type) {
	var	c, text, gch, x_abs, y_abs, type,
		istart, iend,
		ann_font = get_font("annotation"),
		h_ann = ann_font.size,
		line = parse.line

	function get_float() {
		var txt = ''

		while (1) {
			c = text[i++]
			if ("1234567890.-".indexOf(c) < 0)
				return parseFloat(txt)
			txt += c
		}
	} // get_float

	istart = parse.bol + line.index
	if (type.length > 1) {
		text = type.slice(1, -1);
		iend = istart + 1
	} else {
		text = ""
		while (1) {
			c = line.next_char()
			if (!c) {
				line.error("No end of guitar chord")
				return
			}
			if (c == '"')
				break
			if (c == '\\') {
				text += c;
				c = line.next_char()
			}
			text += c
		}
		iend = parse.bol + line.index
	}

	if (curvoice.pos.gch == SL_HIDDEN)
		return

	if (!a_gch)
		a_gch = []

	i = 0;
	type = 'g'
	while (1) {
		c = text[i]
		if (!c)
			break
		gch = {
			text: "",
			istart: istart,
			iend: iend,
		}
		switch (c) {
		case '@':
			type = c;
			i++;
			x_abs = get_float()
			if (c != ',') {
				line.error("',' lacking in annotation '@x,y'");
				y_abs = 0
			} else {
				y_abs = get_float()
				if (c != ' ')
					i--
			}
			break
		case '^':
		case '_':
		case '<':
		case '>':
			i++;
			type = c
			break
		}
		gch.type = type
		if (type == '@') {
			gch.x = x_abs;
			gch.y = y_abs;
			y_abs -= h_ann
		}
		while (1) {
			c = text[i]
			if (!c)
				break
			switch (c) {
			case '\\':
				c = text[++i]
				if (!c || c == 'n')
					break
				gch.text += '\\'
			default:
				gch.text += c;
				i++
				continue
			case '&':			/* skip "&xxx;" */
				while (1) {
					gch.text += c;
					c = text[++i]
					switch (c) {
					default:
						continue
					case ';':
					case undefined:
					case '\\':
						break
					}
					break
				}
				if (c == ';') {
					gch.text += c
					continue
				}
				break
			case ';':
				break
			}
			i++
			break
		}
		a_gch.push(gch)
	}
}

/* transpose a guitar chord */
const	note_names = "CDEFGAB",
	latin_names = [ "Do", "Ré", "Mi", "Fa", "Sol", "La", "Si" ],
	acc_name = ["bb", "b", "", "#", "##"]

function gch_transp(s) {
	var	gch, p,
		i = 0

	function gch_tr1(p) {
		var	new_txt, l,
			n, i1, i2, i3, i4, ix, a, ip, ip2,
			latin = 0

		/* main chord */
		switch (p[0]) {
		case 'A': n = 5; break
		case 'B': n = 6; break
		case 'C': n = 0; break
		case 'D':
			if (p[1] == 'o') {
				latin = 1;
				n = 0		/* Do */
				break
			}
			n = 1
			break
		case 'E': n = 2; break
		case 'F':
			if (p[1] == 'a')
				latin = 1;	/* Fa */
			n = 3
			break
		case 'G': n = 4; break
		case 'L':
			latin = 1;		/* La */
			n = 5
			break
		case 'M':
			latin = 1;		/* Mi */
			n = 2
			break
		case 'R':
			latin = 1
			if (p[1] != 'e')
				latin++;	/* Ré */
			n = 1			/* Re */
			break
		case 'S':
			latin = 1
			if (p[1] == 'o') {
				latin++;
				n = 4		/* Sol */
			} else {
				n = 6		/* Si */
			}
			break
		default:
			return p
		}

		a = 0;
		ip = latin + 1
		if (p[ip] == '#') {
			a++;
			ip++
			if (p[ip] == '#') {
				a++;
				ip++
			}
		} else if (p[ip] == 'b') {
			a--;
			ip++
			if (p[ip] == 'b') {
				a--;
				ip++
			}
		} else if (p[ip] == '=') {
			ip++
		}
		i2 = curvoice.ckey.k_sf - curvoice.okey.k_sf;
		i3 = cde2fcg[n] + i2 + a * 7;
		i4 = cgd2cde[(i3 + 16 * 7) % 7];			// note
		i1 = ((((i3 + 1 + 21) / 7) | 0) + 2 - 3 + 32 * 5) % 5 // accidental
		if (!latin)
			new_txt = note_names[i4] + acc_name[i1]
		else
			new_txt = latin_names[i4] + acc_name[i1];

		ip2 = p.indexOf('/', ip)
		if (ip2 < 0)
			return new_txt + p.slice(ip);

		/* bass */
		n = note_names.indexOf(p[++ip2])
		if (n < 0)
			return new_txt + p.slice(ip);
//fixme: latin names not treated
		new_txt += p.slice(ip, ip2);
		a = 0
		if (p[++ip2] == '#') {
			a++
			if (p[++ip2] == '#') {
				a++;
				ip2++
			}
		} else if (p[ip2] == 'b') {
			a--
			if (p[++ip2] == 'b') {
				a--;
				ip2++
			}
		}
		i3 = cde2fcg[n] + i2 + a * 7;
		i4 = cgd2cde[(i3 + 16 * 7) % 7];
		i1 = ((((i3 + 1 + 21) / 7) | 0) + 2 - 3 + 32 * 5) % 5
		return new_txt + note_names[i4] + acc_name[i1] + p.slice(ip2)
	} // get_tr1

	while (1) {
		gch = s.a_gch[i++]
		if (!gch)
			return
		if (gch.type == 'g')
			break
	}

	p = gch.text;
	i = p.indexOf('\t')
	if (i >= 0) {
		i++;
		p = p.slice(0, i) + gch_tr1(p.slice(i))
	}
	gch.text = gch_tr1(p)
}

/* -- build the guitar chords / annotations -- */
function gch_build(s) {

	/* split the guitar chords / annotations
	 * and initialize their vertical offsets */
	var	gch, w, xspc, ix,
		pos = curvoice.pos.gch == SL_BELOW ? -1 : 1,
		gch_font = get_font("gchord"),
		ann_font = get_font("annotation"),
		y_above = 0,
		y_below = 0,
		y_left = 0,
		y_right = 0,
		h_gch = gch_font.size,
		h_ann = ann_font.size,
		box = cfmt.gchordbox;

	s.a_gch = a_gch;
	a_gch = null

	if (curvoice.transpose)
		gch_transp(s)

	// change the accidentals in the guitar chords,
	// convert the escape sequences in annotations, and
	// set the offsets
	const	GCHPRE = 0.4		// portion of guitar chord before note
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.type == 'g') {
			gch.text = gch.text.replace(/##|#|=|bb|b/g,
				function(x) {
					switch (x) {
					case '##': return "&#x1d12a;"
					case '#': return "\u266f"
					case '=': return "\u266e"
					case 'b': return "\u266d"
					}
					return "&#x1d12b;"
				});
			gch.font = gch_font
		} else {
			gch.text = cnv_escape(gch.text);
			gch.font = ann_font
			if (gch.type == '@' && !user.anno_start)
				continue		/* no width */
		}

		/* set the offsets and widths */
		gene.curfont = gch.font;
		w = strw(gch.text);
		gch.w = w //+ 4
		switch (gch.type) {
		case '@':
			break
		case '^':			/* above */
			xspc = w * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_above -= h_ann;
			gch.y = y_above
			break
		case '_':			/* below */
			xspc = w * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_below -= h_ann;
			gch.y = y_below
			break
		case '<':			/* left */
			gch.x = -(w + 6);
			y_left -= h_ann;
			gch.y = y_left
			break
		case '>':			/* right */
			gch.x = 6;
			y_right -= h_ann;
			gch.y = y_right
			break
		default:			/* guitar chord */
			gch.box = box
			xspc = w * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			if (pos < 0) {		/* below */
				y_below -= h_gch;
				gch.y = y_below
				if (box) {
					y_below -= 2;
					gch.y -= 1
				}
			} else {
				y_above -= h_gch;
				gch.y = y_above
				if (box) {
					y_above -= 2;
					gch.y -= 1
				}
			}
			break
		}
	}

	/* move upwards the top and middle texts */
	y_left /= 2;
	y_right /= 2
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		switch (gch.type) {
		case '^':			/* above */
			gch.y -= y_above
			break
		case '<':			/* left */
			gch.y -= y_left
			break
		case '>':			/* right */
			gch.y -= y_right
			break
		case 'g':			/* guitar chord */
			if (pos > 0)
				gch.y -= y_above
			break
		}
	}
}

/* -- draw the guitar chords and annotations -- */
/* (the staves are not yet defined) */
function draw_gchord(s, gchy_min, gchy_max) {
	var	gch, gch2, text, ix, x, y, i, j,
		box, hbox, xboxl, xboxr, yboxh, yboxl

	/* adjust the vertical offset according to the guitar chords */
//fixme: w may be too small
	var	w = s.a_gch[0].w,
		y_above = y_get(s.st, 1, s.x - 2, w),
		y_below = y_get(s.st, 0, s.x - 2, w),
		n = s.a_gch.length,
		yav = s.yav || 0

	for (ix = 0; ix < n; ix++) {
		gch = s.a_gch[ix]
		if (gch.type != 'g')
			continue
		gch2 = gch		/* guitar chord closest to the staff */
		if (gch.y < 0)
			break
	}
	if (gch2) {
		if (gch2.y >= 0) {
			if (y_above < gchy_max)
				y_above = gchy_max
		} else {
			if (y_below > gchy_min)
				y_below = gchy_min
		}
	}

//	output = staff_tb[s.st].output;
	set_dscale(s.st);
	xboxr = xboxl = s.x;
	yboxh = -100;
	yboxl = 100;
	box = 0
	for (ix = 0; ix < n; ix++) {
		gch = s.a_gch[ix];
		use_font(gch.font);
		gene.curfont = gene.deffont = gch.font;
		h = gch.font.size;
		w = gch.w;
		x = s.x + gch.x;
		text = gch.text
		switch (gch.type) {
		case '_':			/* below */
			y = gch.y + y_below;
			y_set(s.st, 0, x, w, y - h * 0.2 - 2)
			break
		case '^':			/* above */
			y = gch.y + y_above;
			y_set(s.st, 1, x, w, y + h * 0.8 + 2)
			break
		case '<':			/* left */
/*fixme: what symbol space?*/
			if (s.notes[0].acc)
				x -= s.notes[0].shac;
			y = gch.y + yav
			break
		case '>':			/* right */
			x += s.xmx
			if (s.dots > 0)
				x += 1.5 + 3.5 * s.dots;
			y = gch.y + yav
			break
		default:			/* guitar chord */
			hbox = gch.box ? 3 : 2
			if (gch.y >= 0) {
				y = gch.y + y_above;
				y_set(s.st, true, x, w, y + h + hbox)
			} else {
				y = gch.y + y_below;
				y_set(s.st, false, x, w, y - hbox)
			}
			if (gch.box) {
				if (xboxl > x)
					xboxl = x;
				w += x
				if (xboxr < w)
					xboxr = w
				if (yboxl > y)
					yboxl = y
				if (yboxh < y + h)
					yboxh = y + h;
				box++
			}
			i = text.indexOf('\t')

			/* if some TAB: expand the guitar chord */
			if (i >= 0) {
				x = realwidth
				for (var next = s.next; next; next = next.next) {
					switch (next.type) {
					default:
						continue
					case NOTE:
					case REST:
					case BAR:
						x = next.x
						break
					}
					break
				}
				j = 2
				for (;;) {
					i = text.indexOf('\t', i + 1)
					if (i < 0)
						break
					j++
				}
				var expdx = (x - s.x) / j;

				x = s.x
				if (user.anno_start)
					user.anno_start("gchord", gch.istart, gch.iend,
						x - 2, y + h + 2, w + 4, h + 4, s)
				i = 0;
				j = i
				for (;;) {
					i = text.indexOf('\t', j)
					if (i < 0)
						break
					xy_str(x, y + h * 0.2,
							text.slice(j, i), 'c');
					x += expdx;
					j = i + 1
				}
				xy_str(x, y + h * 0.2, text.slice(j), 'c')
				if (user.anno_stop)
					user.anno_stop("gchord", gch.istart, gch.iend,
						s.x - 2, y + h + 2, w + 4, h + 4, s)
				continue
			}
			break
		case '@':			/* absolute */
			y = gch.y + yav
			if (y > 0)
				y_set(s.st, 1, x, 1, y + h * 0.8 + 3)
			else
				y_set(s.st, 0, x, 1, y - h * 0.2)
			break
		}
		if (user.anno_start)
			user.anno_start("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
		xy_str(x, y + h * 0.2, text)		/* (descent) */
		if (user.anno_stop)
			user.anno_stop("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
	}

	/* draw the box of the guitar chords */
	if (xboxr != xboxl) {		/* if any normal guitar chord */
		xboxl -= 2;
		w = xboxr - xboxl;
		h = yboxh - yboxl + 3;
		xybox(xboxl, yboxl - 1 + h, w, h)
	}
}
