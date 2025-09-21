#include <crow/app.h>
#include "logic.hpp"

using crow::SimpleApp;
using crow::response;
using crow::request;
using crow::HTTPMethod;

int main() {
    SimpleApp app;

    CROW_ROUTE(app, "/api/pcm").methods(HTTPMethod::POST)([](const crow::request& req){
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "Invalid JSON");

        double freq = x["frequency"].d();
        double dur = x["duration"].d();
        int sr = x["sr"].i();
        double amp = x["amp"].d();

        crow::json::wvalue res;
        res["pcmData"]=generatePCM(freq, dur, sr, amp);

        return response(res);
    });

    app.port(18080).multithreaded().run();
}