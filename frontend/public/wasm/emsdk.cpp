#include <emscripten/bind.h>
#include "logic.hpp"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(my_module) {
  function("generatePCM", &generatePCM);
  register_vector<int16_t>("VectorInt16");
  // By default, Embind only knows about primitive types (int, double, bool, std::string, etc.).
  // Complex types like std::vector<T> need to be registered manually.
}