let dynamicHeader = () => {
    let height = Math.min(300, window.innerWidth * 0.4)
    $(".header").css("height", `${height}px`)
}

function waitForElement(querySelector, timeout = 0) {
    const startTime = new Date().getTime();
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            if (document.querySelector(querySelector)) {
                clearInterval(timer);
                resolve();
            } else if (timeout && now - startTime >= timeout) {
                clearInterval(timer);
                reject();
            }
        }, 100);
    });
}

let buttonSwitch = function (event, metricsData, chart) {
    let target = event.target
    let targetData = metricsData[target.id]

    for (let element of target.parentNode.childNodes) {

        // Get our items from parent
        if (element.classList === undefined || !element.classList.contains("metricsSelector")) continue;

        if (element.id !== target.id && element.classList.contains("selected")) element.classList.remove("selected");
        if (element.id === target.id && !element.classList.contains("selected")) {

            element.classList.add("selected");
            chart.series[0].setData(JSON.parse(JSON.stringify(targetData)))
            chart.redraw()


        }
    }

}

let networkRequest = async (queries) => {

    for (let key of Object.keys(queries)) {
        queries[key] = await fetch(queries[key]).then(response => response.json());
    }

    return queries;
}

let generalStatuses = {
    0: {color: "#7b0f0f", message: "Network Failing"},
    1: {color: "#cb1e1e", message: "Extreme Issue"},
    2: {color: "#d47d13", message: "Mild Issues"},
    3: {color: "#2c7b3d", message: "Operational"}
}

let overallStatuses = {
    0: {color: "#7b0f0f", message: "Services Failing"},
    1: {color: "#cb1e1e", message: "Extreme Service Issues"},
    2: {color: "#d47d13", message: "Mild Service Issues"},
    3: {color: "#2c7b3d", message: "All Services Peachy :)"}
}


let initialize = () => {

    $("#footer").load("static/footer.html");
    $(window).on('resize', () => dynamicHeader());
    $("#header").load("static/header.html", () => {
        waitForElement("#header").then(() => {
            setTimeout(() => {
                dynamicHeader();
                document.body.style.display = '';
            }, 50);
        })

    });


    /**
     * Main page queries
     */
    if ((window.location.pathname).includes("index.html")) {


        /**
         * Operational statuses & Overall Status
         */
        waitForElement(".statusSummary").then(() => {
            waitForElement(".boxWrapper").then(() => {

                networkRequest({
                    javaNetworkStatus: "https://api.mineplex.club/status/java/america",
                    bedrockNetworkUSStatus: "https://api.mineplex.club/status/bedrock/america",
                    bedrockNetworkEUStatus: "https://api.mineplex.club/status/bedrock/europe",
                    websiteStatus: "https://api.mineplex.club/status/website",
                    storeStatus: "https://api.mineplex.club/status/store",
                    overallStatus: "https://api.mineplex.club/status"
                }).then((response) => {
                    Object.keys(response).forEach((key) => {

                        if (key !== "overallStatus") {
                            let entry = response[key];
                            let status = entry["condition"]
                            let config = generalStatuses[status]

                            console.log(config)

                            let jQueryElement = $(`#${key}`).css("color", config["color"]);
                            let DOMElement = jQueryElement.get(0);

                            DOMElement.classList.remove("componentStatusLoading")
                            DOMElement.classList.add("componentStatus")
                            DOMElement.innerHTML = config["message"]
                        } else {
                            let overall = response["overallStatus"]["overall"];
                            let config = overallStatuses[overall];

                            let jQueryElement = $(".statusSummary").css("background-color", config["color"]).css("color", "white")
                            let DOMElement = jQueryElement.get(0);

                            DOMElement.classList.remove("statusSummaryLoading")
                            DOMElement.innerHTML = config["message"]
                        }


                    })

                    $(".componentStatusBox").css("min-width", "0")

                });

            });

        });


        /**
         * Line Charts
         */
        waitForElement("#javaMetrics").then(() => {
            waitForElement("#bedrockMetrics").then(() => {

                let currentlyActiveJava = 'javaDay';
                let currentlyActiveBedrock = "bedrockDay";

                Highcharts.setOptions({
                    time: {
                        timezone: moment.tz.guess()
                    }
                });

                // Stop metrics buttons from sending back to top of page
                $('a.metricsSelector').click(function (e) {
                    e.preventDefault();
                });

                // Make placeholder charts
                ["javaMetrics", "bedrockMetrics"].forEach((key) => {
                    $.getJSON("static/chart.json", (data) => {
                        data["series"][0]["data"] = [[0, 100], [1, 100]];
                        Highcharts.chart(key, data);
                    });
                })

                // Make the API requests
                networkRequest({
                    javaDay: "https://api.mineplex.club/status/java/history?period=day",
                    javaWeek: "https://api.mineplex.club/status/java/history?period=week",
                    javaMonth: "https://api.mineplex.club/status/java/history?period=month",
                    bedrockDay: "https://api.mineplex.club/status/bedrock/history?period=day",
                    bedrockWeek: "https://api.mineplex.club/status/bedrock/history?period=week",
                    bedrockMonth: "https://api.mineplex.club/status/bedrock/history?period=month"
                }).then(metricsData => {

                    /**
                     * Java Chart
                     */
                    {
                        let javaChart = $.getJSON("static/chart.json", (data) => {
                            data["series"][0]["data"] = JSON.parse(JSON.stringify(metricsData[currentlyActiveJava]))
                            javaChart = Highcharts.chart('javaMetrics', data);
                        });

                        ["#javaDay", "#javaWeek", "#javaMonth"].forEach((item) => {

                            $(item).on('click', (event) => {
                                console.log(metricsData)
                                buttonSwitch(event, JSON.parse(JSON.stringify(metricsData)), javaChart)
                                console.log(metricsData)
                            })
                        })

                    }

                    /**
                     * Bedrock Chart
                     */
                    {
                        // Built the chart
                        let bedrockChart = $.getJSON("static/chart.json", (data) => {
                            data["series"][0]["data"] = JSON.parse(JSON.stringify(metricsData[currentlyActiveBedrock]))
                            bedrockChart = Highcharts.chart('bedrockMetrics', data);
                        });

                        // Set the buttons
                        ["#bedrockDay", "#bedrockWeek", "#bedrockMonth"].forEach((item) => {

                            $(item).on('click', (event) => {
                                buttonSwitch(event, JSON.parse(JSON.stringify(metricsData)), bedrockChart)
                            })
                        })
                    }

                })

            });
        });


    }


}