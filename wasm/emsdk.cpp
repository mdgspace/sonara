#include <emscripten/bind.h>
#include "logic.hpp"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(my_module) {
  function("generatePCM", &generatePCM);
}