let dynamicResizing = () => {
    let header = $(".header");
    let metricsTitle = $(".metricsTitle");
    let metricsTitleCount = $(".metricsTitleCount");
    let metricsTitleCountLoading = $(".metricsTitleCountLoading");
    let metricsSelector = $(".metricsSelector");
    let componentName = $(".componentName");
    let componentStatus = $(".componentStatus");

    console.log(window.innerWidth)
    header.css("height", `${Math.min(300, window.innerWidth * 0.4)}px`)

    if (window.innerWidth < 660) {

        // Make stuff smaller
        metricsTitle.css("font-size", "20px");
        metricsTitleCount.css("font-size", "13px");
        metricsTitleCountLoading.css("font-size", "13px");
        metricsSelector.css("font-size", "13px");
        componentName.css("font-size", "15px");
        componentStatus.css("font-size", "13px");

        // Hide the title count
        if (window.innerWidth < 450) metricsTitleCount.css("display", "none")
        else metricsTitleCount.css("display", "");

        // Hide the size selector
        if (window.innerWidth < 350) metricsSelector.css("display", "none")
        else metricsSelector.css("display", "");


    } else {

        // Make stuff bigger again
        metricsTitle.css("font-size", "");
        metricsTitleCount.css('font-size', "");
        metricsTitleCount.css('display', "");
        metricsTitleCountLoading.css("'font-size", "")
        metricsSelector.css("font-size", "");
        metricsSelector.css("display", "");
        componentName.css("font-size", "");
        componentStatus.css("font-size", "");

    }

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
    0: {color: "#7b0f0f", message: "Service Failing"},
    1: {color: "#cb1e1e", message: "Extreme Issue"},
    2: {color: "#d47d13", message: "Mild Issues"},
    3: {color: "#2c7b3d", message: "Operational"}
}

let overallStatuses = {
    0: {color: "#7b0f0f", message: "Network Services Failing"},
    1: {color: "#cb1e1e", message: "Extreme Network Issues"},
    2: {color: "#d47d13", message: "Experiencing Network Issues"},
    3: {color: "#2c7b3d", message: "All Services to Chiss' Standards"}
}

let metricsTitles = [
    {
        prefix: "Java Metrics",
        elementId: "#javaMetricsTitle",
        networkQueryName: "javaNetworkStatus"
    },
    {
        prefix: "Bedrock Metrics",
        elementId: "#bedrockMetricsTitle",
        networkQueryName: "bedrockNetworkUSStatus"
    }
]

let globals = () => {
    $(window).on('resize', () => dynamicResizing());

    let header = $("#header");
    header.get(0).innerHTML = (`
        <div class=header>
        <img class="header-logo" onclick="window.location.href = 'https://www.mineplex.com/'"
            alt="E-Date Plex" src="./static/logo.png">
        </div>
    `);

    waitForElement("#header").then(() => {
        setTimeout(() => {

            /**
             * Dynamic Header Stuff
             */
            {
                repeatWithDelay(dynamicResizing, 15, 50);
                document.body.style.display = '';
            }

        }, 50);

    })


}

let repeatWithDelay = (fn, times, delay) => {
    setTimeout(() => {
        if (times < 1) return;
        fn();
        repeatWithDelay(fn, times - 1, delay);
    }, delay);
}


let initialize = (home) => {

    // Globally created items (all pages)
    globals();

    // Home Page Only
    if (!home) return;

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


                });

                /**
                 * Metrics for network players
                 */
                metricsTitles.forEach((platform) => {
                    let metricsTitleDOM = $(platform.elementId).get(0);
                    let platformCount = response[platform.networkQueryName]["onlinePlayers"]
                    platformCount = (platformCount > 1) ? `(${platformCount.toLocaleString()} Online)` : ``;
                    metricsTitleDOM.innerHTML = `${platform.prefix} <span class="metricsTitleCount">${platformCount}</span>`;
                });

                dynamicResizing();


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
                 * Java Metrics
                 */
                {
                    let javaChart = $.getJSON("static/chart.json", (data) => {
                        console.log("test");
                        data["series"][0]["data"] = JSON.parse(JSON.stringify(metricsData[currentlyActiveJava]))
                        javaChart = Highcharts.chart('javaMetrics', data);
                    });

                    ["#javaDay", "#javaWeek", "#javaMonth"].forEach((item) => {

                        $(item).on('click', (event) => {
                            buttonSwitch(event, JSON.parse(JSON.stringify(metricsData)), javaChart)
                        })
                    })

                }

                /**
                 * Bedrock Metrics
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