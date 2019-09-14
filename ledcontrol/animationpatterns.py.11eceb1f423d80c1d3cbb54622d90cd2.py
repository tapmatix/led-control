# led-control WS2812B LED Controller Server
# Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

import math
from random import random
from enum import Enum

import ledcontrol.rpi_ws281x as rpi_ws281x
import ledcontrol.utils as utils

ColorMode = Enum('ColorMode', ['hsv', 'rgb'])

# Primary animations that generate patterns in HSV or RGB color spaces
# return color, mode

def blank(t, dt, x, y, prev_state, colors):
    return (0, 0, 0), ColorMode.hsv

default = {
    0: '''
def pattern(t, dt, x, y, prev_state, colors):
    return colors[0], hsv
''',
    1: '''
def pattern(t, dt, x, y, prev_state, colors):
    return (t + x, 1, 1), hsv
''',
    2: '''
def pattern(t, dt, x, y, prev_state, colors):
    hue = (t + x) % 1
    return (hue - (hue % 0.1666), 1, 1), hsv
''',
    3: '''
def pattern(t, dt, x, y, prev_state, colors):
    return (wave_sine(t + x),
            wave_sine((t + x) * 1.2),
            wave_sine((t + x) * 1.4)), rgb
''',
    4: '''
def pattern(t, dt, x, y, prev_state, colors):
    return (wave_cubic(t + x),
            wave_cubic((t + x) * 1.2),
            wave_cubic((t + x) * 1.4)), rgb
''',
    5: '''
def pattern(t, dt, x, y, prev_state, colors):
    v = (t + x) % 1
    c = blackbody_to_rgb(v * v * 5500 + 1000)
    return (c[0] * v, c[1] * v, c[2] * v), rgb
''',
    6: '''
def pattern(t, dt, x, y, prev_state, colors):
    return (math.fabs((2 * t) % 2 - 1) + x, 1, 1), hsv
''',
    7: '''
def pattern(t, dt, x, y, prev_state, colors):
    color = [0, 0, 0]
    t2 = t
    for i in range(3):
        delay = 0.05 * i
        v = x + (wave_sine(t2 + delay)) + wave_sine(x + 0.666 * t2 + delay)
        color[i] = 0.03 / wave_triangle(v)
    return color, rgb
''',
}

default_names = {
    0: 'Solid Color',
    1: 'Cycle Hue 1D',
    2: 'Cycle Hue Bands 1D',
    3: 'RGB Sines 1D',
    4: 'RGB Cubics 1D',
    5: 'Cycle Blackbody 1D',
    6: 'Bounce Hue 1D',
    7: 'RGB Ripples 1D',
}

# Secondary animations that transform finalized colors to add brightness-based effects
# return brightness, colorRGB

def sine_1d(t, dt, x, y, prev_state, in_color):
    return in_color, rpi_ws281x.wave_sine(t + x)

def cubic_1d(t, dt, x, y, prev_state, in_color):
    return in_color, rpi_ws281x.wave_cubic(t + x)

def ramp_1d(t, dt, x, y, prev_state, in_color):
    return in_color, (t + x) % 1 # test ramp^2

def bounce_triangle_1d(t, dt, x, y, prev_state, in_color):
    return in_color, rpi_ws281x.wave_sine(x + rpi_ws281x.wave_triangle(t))

def bounce_sine_1d(t, dt, x, y, prev_state, in_color):
    return in_color, rpi_ws281x.wave_sine(x + rpi_ws281x.wave_sine(t))

def bounce_cubic_1d(t, dt, x, y, prev_state, in_color):
    return in_color, rpi_ws281x.wave_cubic(x + rpi_ws281x.wave_sine(t))

def twinkle_pulse_1d(t, dt, x, y, prev_state, in_color):
    v = prev_state[0] - dt
    if v <= 0:
        return in_color, random()
    else:
        return in_color, v, prev_state[1]

default_secondary = {
    0: None,
    1: sine_1d,
    2: cubic_1d,
    3: ramp_1d,
    4: bounce_triangle_1d,
    5: bounce_sine_1d,
    6: bounce_cubic_1d,
    7: twinkle_pulse_1d,
}

default_secondary_names = {
    k: utils.snake_to_title(v.__name__) if v else 'None' for k, v in default_secondary.items()
}