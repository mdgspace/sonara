#include <emscripten/bind.h>
#include "dsp.hpp"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(sonara_dsp_module) {
    // Define the Node struct for JS interop
    value_object<Node>("Node")
        .field("x", &Node::x)
        .field("y", &Node::y);

    // Register vector types to allow passing arrays from JS
    register_vector<int16_t>("Int16Vector");
    register_vector<Node>("VectorNode");
    register_vector<double>("VectorDouble");
    register_vector<std::vector<double>>("VectorVectorDouble");

    // Expose the C++ functions to JavaScript
    function("applyShape", &applyShape);
    function("applyEnvelope", &applyEnvelope);
    function("generatePcmData", &generatePcmData);
}