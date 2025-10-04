#include "dsp.hpp"

double applyShape(double t, double shape) {
    if (shape == 0.0) {
        return 0.0; // No curve, so the offset from the straight line is 0.
    }
    // This formula creates a parabolic curve that is 0 at t=0 and t=1,
    // and has a maximum/minimum value scaled by `shape`.
    return shape * 4.0 * (t - t * t);
}