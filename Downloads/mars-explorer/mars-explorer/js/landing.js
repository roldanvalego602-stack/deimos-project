
// DEIMOS PROJECT
// Entry, Descent and Landing System

function enableLandingAssessment() {

    const el = id => document.getElementById(id);

    const panel = el("mission-panel");

    if (!panel || el("landing-assessment")) return;

    const stages = [
        { time: 0, name: "Atmospheric entry" },
        { time: 75, name: "Peak heating" },
        { time: 240, name: "Parachute deployment" },
        { time: 260, name: "Heat shield separation" },
        { time: 408, name: "Sky crane maneuver" },
        { time: 420, name: "Touchdown" }
    ];

    const totalTime = 420;

    let elapsed = 0;
    let timer = null;

    const section = document.createElement("section");

    section.id = "landing-assessment";
    section.className = "landing-assessment";

    section.innerHTML = `

        <h3>LANDING CONTROL</h3>

        <p class="landing-source">
            NASA / JPL / MARS 2020
        </p>

        <p>Historical EDL reconstruction</p>

        <div class="landing-countdown">

            <small>TIME TO TOUCHDOWN</small>

            <strong id="landing-time">07:00</strong>

            <p id="landing-stage">
                Atmospheric entry
            </p>

        </div>

        <input id="landing-timeline"
               type="range"
               min="0"
               max="420"
               value="0">

        <div class="landing-actions">

            <button id="landing-start">
                Play Simulation
            </button>

            <button id="landing-pause">
                Pause
            </button>

            <button id="landing-reset">
                Reset
            </button>

        </div>

        <p class="landing-note">
            Playback speed: 10x
        </p>

        <div id="landing-stages"></div>

        <h3>NASA MISSION REFERENCE</h3>

        <div class="mission-metrics">

            <div class="mission-metric">
                <small>EDL DURATION</small>
                <strong>7 min</strong>
            </div>

            <div class="mission-metric">
                <small>ENTRY SPEED (km/h)</small>
                <strong>20,000</strong>
            </div>

            <div class="mission-metric">
                <small>PEAK SHIELD TEMP.</small>
                <strong>1300 °C</strong>
            </div>

            <div class="mission-metric">
                <small>EARTH-MARS CRUISE</small>
                <strong>203 days</strong>
            </div>

        </div>

        <h3>LANDING SITE ASSESSMENT</h3>

        <p>
            Use the first expedition waypoint
            as a hypothetical landing location.
        </p>

        <button id="landing-analyze">
            Analyze Candidate Site
        </button>

        <div id="landing-site-report">
            No site evaluated.
        </div>

        <div class="mission-warning">

            Historical robotic mission reference.

            Human landing duration depends on
            spacecraft design, trajectory,
            atmospheric conditions and propulsion.

            MOLA cannot resolve small landing hazards.

            Landing safety is not certified.

        </div>

        <a href="https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/mission/"
           target="_blank" rel="noopener">
            NASA Official EDL Profile
        </a>

    `;

    // Add a standalone dashboard section.

    panel.appendChild(section);


    // FORMAT TIME

    function formatTime(seconds) {

        const minutes = Math.floor(seconds / 60);

        const remaining = seconds % 60;

        return String(minutes).padStart(2, "0") +
            ":" +
            String(remaining).padStart(2, "0");
    }


    // UPDATE LANDING TIMELINE

    function updateLanding() {

        const remaining = totalTime - elapsed;

        el("landing-time").textContent =
            formatTime(remaining);

        el("landing-timeline").value = elapsed;

        const currentStage = [...stages]
            .reverse()
            .find(stage => elapsed >= stage.time);

        el("landing-stage").textContent =
            currentStage.name;

        el("landing-stages").innerHTML = stages.map(

            stage => `

                <div class="landing-step
                     ${elapsed >= stage.time ? "completed" : ""}">

                    <span>
                        ${elapsed >= stage.time ? "●" : "○"}
                        ${stage.name}
                    </span>

                    <small>
                        T+${formatTime(stage.time)}
                    </small>

                </div>

            `

        ).join("");

        if (elapsed >= totalTime) {

            pauseLanding();

            el("landing-stage").textContent =
                "Historical touchdown completed.";
        }
    }


    // SIMULATION CONTROLS

    function startLanding() {

        if (timer !== null) return;

        if (elapsed >= totalTime) {
            elapsed = 0;
        }

        updateLanding();

        timer = setInterval(() => {

            elapsed = Math.min(
                elapsed + 10,
                totalTime
            );

            updateLanding();

        }, 1000);
    }

    function pauseLanding() {

        clearInterval(timer);

        timer = null;
    }

    function resetLanding() {

        pauseLanding();

        elapsed = 0;

        updateLanding();
    }


    // READ NASA MOLA ELEVATION

    async function analyzeLandingSite() {

        const report = el("landing-site-report");

        const mission =
            window.DEIMOS_MISSION?.getSnapshot();

        if (!mission?.waypoints.length) {

            report.textContent =
                "Create an expedition waypoint first.";

            return;
        }

        const point = mission.waypoints[0];

        report.textContent =
            "Reading NASA MOLA dataset...";

        try {

            const coordinates =
                Cesium.Cartographic.fromDegrees(
                    point.longitude,
                    point.latitude
                );

            const results = await MOLA.sampleRoute(
                [coordinates]
            );

            const elevation = results[0]?.height;

            if (!Number.isFinite(elevation)) {

                report.textContent =
                    "Site outside available MOLA coverage.";

                return;
            }

            report.innerHTML = `

                <div class="mission-metric">

                    <small>MOLA SITE ELEVATION</small>

                    <strong>
                        ${elevation.toFixed(0)} m
                    </strong>

                </div>

                <p>
                    Latitude:
                    ${point.latitude.toFixed(5)}°
                </p>

                <p>
                    Longitude:
                    ${point.longitude.toFixed(5)}°
                </p>

                <p>
                    Source: NASA / MGS / MOLA.
                </p>

                <p>
                    Local landing slope:
                    Not evaluated.
                </p>

                <p>
                    Rocks and surface hazards:
                    Not resolved.
                </p>

                <p>
                    Landing suitability:
                    Undetermined.
                </p>

            `;

        } catch (error) {

            report.textContent = error.message;

            console.error("LANDING MOLA ERROR:", error);
        }
    }


    // EVENTS

    el("landing-start").addEventListener(
        "click", startLanding
    );

    el("landing-pause").addEventListener(
        "click", pauseLanding
    );

    el("landing-reset").addEventListener(
        "click", resetLanding
    );

    el("landing-timeline").addEventListener(
        "input", event => {

            pauseLanding();

            elapsed = Number(event.target.value);

            updateLanding();
        }
    );

    el("landing-analyze").addEventListener(
        "click", analyzeLandingSite
    );

    updateLanding();

    console.log(
        "DEIMOS: Landing Assessment initialized."
    );
}
