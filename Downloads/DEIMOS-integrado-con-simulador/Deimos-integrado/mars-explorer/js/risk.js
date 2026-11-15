
// DEIMOS PROJECT
// Environmental Risk Assessment

function enableRiskAssessment() {

    const el = id => document.getElementById(id);

    const panel = el("mission-panel");

    if (!panel || el("risk-assessment")) return;

    const section = document.createElement("section");

    section.id = "risk-assessment";
    section.className = "risk-assessment";

    section.innerHTML = `

        <h3>ENVIRONMENTAL RISK ASSESSMENT</h3>

        <label>Operational time limit (hours)</label>

        <input id="risk-time-limit" type="number"
               min="1" max="48" value="8">

        <label>Selected slope limit (degrees)</label>

        <input id="risk-slope-limit" type="number"
               min="1" max="90" value="10">

        <p class="risk-note">
            User-defined limits. Not NASA safety standards.
        </p>

        <div id="risk-results"></div>

        <div id="risk-summary"></div>

        <p class="risk-note">
            Historical environmental observations.
            Mission safety cannot be certified.
        </p>

    `;

    panel.appendChild(section);


    // READ MISSION METRICS

    function readMetric(id) {

        const element = el(id);

        if (!element) return null;

        const value = parseFloat(
            element.textContent
        );

        return Number.isFinite(value)
            ? value
            : null;
    }


    // CREATE RISK CARD

    function card(title, value, description, source, level) {

        return `

            <div class="risk-card ${level}">

                <small>${title}</small>

                <strong>${value}</strong>

                <p>${description}</p>

                <span>${source}</span>

            </div>

        `;
    }


    // EVALUATE ENVIRONMENTAL CONDITIONS

    function evaluateRisk() {

        const duration = readMetric("mission-duration");
        const distance = readMetric("mission-distance");
        const radiation = readMetric("mission-radiation");
        const slope = readMetric("mission-slope");

        const timeLimit = Number(
            el("risk-time-limit").value
        );

        const slopeLimit = Number(
            el("risk-slope-limit").value
        );

        const validTimeLimit =
            timeLimit > 0 && Number.isFinite(timeLimit);

        const validSlopeLimit =
            slopeLimit > 0 &&
            slopeLimit <= 90 &&
            Number.isFinite(slopeLimit);

        const gale = el("mission-gale")?.checked;

        let warnings = 0;
        let unknown = 0;

        const results = [];


        // TERRAIN INCLINATION

        if (slope === null || !validSlopeLimit) {

            unknown++;

            results.push(card(

                "TERRAIN INCLINATION",
                "Not evaluated",

                "Analyze the terrain and set a valid slope limit.",

                "NASA / MGS / MOLA",
                "unknown"

            ));

        } else {

            const exceeded = slope > slopeLimit;

            if (exceeded) warnings++;

            results.push(card(

                "TERRAIN INCLINATION",

                `${slope.toFixed(1)}°`,

                exceeded
                    ? "Sampled slope exceeds selected limit."
                    : "Sampled slope is within selected limit.",

                "NASA / MOLA - DEIMOS calculation",

                exceeded ? "danger" : "nominal"

            ));
        }


        // MISSION DURATION

        if (duration === null || !validTimeLimit) {

            unknown++;

            results.push(card(

                "MISSION DURATION",
                "Not evaluated",

                "Create a route and set a valid time limit.",

                "DEIMOS Mission Planner",
                "unknown"

            ));

        } else {

            const exceeded = duration > timeLimit;

            if (exceeded) warnings++;

            const remaining = timeLimit - duration;

            results.push(card(

                "MISSION DURATION",

                `${duration.toFixed(2)} h`,

                exceeded

                    ? `Time limit exceeded by ${Math.abs(remaining).toFixed(2)} h.`

                    : `${remaining.toFixed(2)} h remaining within selected limit.`,

                "DEIMOS / User-defined parameters",

                exceeded ? "danger" : "nominal"

            ));
        }


        // RADIATION EXPOSURE

        if (radiation !== null && gale) {

            results.push(card(

                "RADIATION EXPOSURE",

                `${radiation.toFixed(3)} mSv`,

                "Estimated using historical Gale Crater measurements. Solar events and shielding are not modeled.",

                "NASA / Curiosity / RAD",

                "caution"

            ));

        } else {

            unknown++;

            results.push(card(

                "RADIATION EXPOSURE",
                "Not evaluated",

                "No applicable radiation estimate selected.",

                "NASA / RAD",
                "unknown"

            ));
        }


        // THERMAL CONDITIONS

        if (gale) {

            const temperature =
                NASA_DATA.regions.gale.temperature;

            results.push(card(

                "THERMAL CONDITIONS",

                `${temperature.typicalDailyMinC} / ${temperature.typicalDailyMaxC} °C`,

                "Historical Gale reference. Thermal protection is required.",

                "NASA / Curiosity / REMS",

                "caution"

            ));

        } else {

            unknown++;

            results.push(card(

                "THERMAL CONDITIONS",
                "Unknown",

                "No applicable local temperature data selected.",

                "NASA / REMS",
                "unknown"

            ));
        }


        // SURFACE OBSTACLES

        unknown++;

        results.push(card(

            "SURFACE OBSTACLES",
            "Not evaluated",

            "MOLA resolution cannot identify individual rocks or small obstacles.",

            "NASA / MOLA - 128 pixels per degree",

            "unknown"

        ));


        // SOLAR ACTIVITY

        unknown++;

        results.push(card(

            "CURRENT SOLAR ACTIVITY",
            "Unknown",

            "No real-time solar radiation forecast available.",

            "Space weather data pending",

            "unknown"

        ));


        // ATMOSPHERIC CONDITIONS

        unknown++;

        results.push(card(

            "ATMOSPHERIC CONDITIONS",
            "Unknown",

            "Current pressure, wind and dust conditions are not evaluated.",

            "Atmospheric data pending",

            "unknown"

        ));


        // DISPLAY RESULTS

        el("risk-results").innerHTML =
            results.join("");

        el("risk-summary").innerHTML = `

            <h3>MISSION ASSESSMENT</h3>

            <p>
                Route distance:
                ${distance === null
                    ? "Unknown"
                    : distance.toFixed(3) + " km"}
            </p>

            <p>
                Operational limits exceeded:
                <strong>${warnings}</strong>
            </p>

            <p>
                Unevaluated factors:
                <strong>${unknown}</strong>
            </p>

            <p>

                ${warnings > 0

                    ? "Review expedition parameters before proceeding."

                    : "No exceedances detected among evaluated operational limits."

                }

            </p>

            <small>
                This assessment does not confirm mission safety.
            </small>

        `;
    }


    // AUTOMATIC UPDATES

    const observer = new MutationObserver(
        evaluateRisk
    );

    [

        "mission-distance",
        "mission-duration",
        "mission-radiation",
        "mission-temperature",
        "mission-slope"

    ].forEach(id => {

        const element = el(id);

        if (element) {

            observer.observe(element, {

                childList: true,
                characterData: true,
                subtree: true

            });
        }
    });


    // PARAMETER EVENTS

    [

        "risk-time-limit",
        "risk-slope-limit",
        "mission-gale"

    ].forEach(id => {

        el(id)?.addEventListener(
            "input",
            evaluateRisk
        );

    });


    // INITIAL ASSESSMENT

    evaluateRisk();

    console.log(
        "DEIMOS: Risk Assessment initialized."
    );
}
