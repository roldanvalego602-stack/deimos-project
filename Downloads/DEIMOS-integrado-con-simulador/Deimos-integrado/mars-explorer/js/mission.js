
// DEIMOS PROJECT
// Expedition Planning System

function enableMissionPlanner(viewer, tileset) {

    const el = id => document.getElementById(id);

    const scene = viewer.scene;
    const ellipsoid = Cesium.Ellipsoid.MARS;

    const panel = el("mission-panel");
    const status = el("mission-status");

    let waypoints = [];
    let markers = [];
    let routeEntity = null;
    let mapping = false;
    let routeVersion = 0;

    const handler = viewer.screenSpaceEventHandler;

    const originalClick = handler.getInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );


    // OPEN AND CLOSE PANEL

    function openPlanner() {

        panel.hidden = false;

        el("region-panel").classList.add("hidden");

        el("open-mission").hidden = true;
    }

    el("open-mission").addEventListener(
        "click", openPlanner
    );

    el("close-mission").addEventListener("click", () => {

        stopMapping();

        panel.hidden = true;

        el("open-mission").hidden = false;
    });

    const planButton = el("plan-mission");

    if (planButton) {

        planButton.disabled = false;

        planButton.addEventListener(
            "click", openPlanner
        );
    }


    // START AND STOP MAPPING

    function startMapping() {

        mapping = true;

        viewer.selectedEntity = undefined;

        el("start-route").textContent = "Finish Mapping";
        el("start-route").classList.add("active");

        viewer.canvas.style.cursor = "crosshair";

        status.textContent =
            "Click on Mars to add waypoints.";

        handler.setInputAction(
            pickWaypoint,
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
    }

    function stopMapping() {

        mapping = false;

        viewer.canvas.style.cursor = "";

        el("start-route").textContent = "Start Mapping";
        el("start-route").classList.remove("active");

        if (originalClick) {

            handler.setInputAction(
                originalClick,
                Cesium.ScreenSpaceEventType.LEFT_CLICK
            );

        } else {

            handler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_CLICK
            );
        }

        status.textContent =
            "Mapping paused. Review your expedition.";
    }

    el("start-route").addEventListener("click", () => {

        if (mapping) {
            stopMapping();
        } else {
            startMapping();
        }
    });


    // SELECT POINTS ON MARS

    function pickWaypoint(event) {

        if (!mapping) return;

        if (!scene.pickPositionSupported) {

            status.textContent =
                "Surface picking is not supported.";

            return;
        }

        const picked = scene.pick(event.position);

        if (
            !picked ||
            (picked.primitive !== tileset &&
             picked.tileset !== tileset)
        ) {

            status.textContent =
                "Select a visible Martian surface point.";

            return;
        }

        const position = scene.pickPosition(
            event.position
        );

        if (!Cesium.defined(position)) return;

        const coordinates =
            ellipsoid.cartesianToCartographic(position);

        if (!coordinates) return;

        if (waypoints.length >= 20) {

            status.textContent =
                "Maximum of 20 waypoints reached.";

            return;
        }

        if (
            waypoints.length &&
            surfaceDistance(
                waypoints[waypoints.length - 1].coordinates,
                coordinates
            ) < 1
        ) return;

        waypoints.push({
            position: position.clone(),
            coordinates: coordinates.clone()
        });

        createMarker(position, waypoints.length);

        routeChanged();

        status.textContent =
            `Waypoint ${waypoints.length} registered.`;
    }


    // CREATE WAYPOINT MARKER

    function createMarker(position, number) {

        const marker = viewer.entities.add({

            position: position,

            point: {
                pixelSize: 11,

                color: number === 1
                    ? Cesium.Color.LIME
                    : Cesium.Color.CYAN,

                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,

                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY
            },

            label: {

                text: number === 1
                    ? "HABITAT"
                    : `WP-${number - 1}`,

                font: "12px monospace",
                fillColor: Cesium.Color.WHITE,

                pixelOffset:
                    new Cesium.Cartesian2(0, -22),

                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,

                style:
                    Cesium.LabelStyle.FILL_AND_OUTLINE,

                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY
            }

        });

        markers.push(marker);
    }


    // DRAW SURFACE ROUTE

    function drawRoute() {

        if (routeEntity) {

            viewer.entities.remove(routeEntity);
            routeEntity = null;
        }

        if (waypoints.length < 2) return;

        routeEntity = viewer.entities.add({

            polyline: {

                positions: waypoints.map(
                    point => point.position
                ),

                width: 4,

                material: Cesium.Color.CYAN,

                clampToGround: true,

                classificationType:
                    Cesium.ClassificationType.CESIUM_3D_TILE
            }

        });
    }


    // DISTANCE ON MARS

    function surfaceDistance(a, b) {

        const geodesic = new Cesium.EllipsoidGeodesic(
            a, b, ellipsoid
        );

        return geodesic.surfaceDistance;
    }

    function calculateDistance() {

        let meters = 0;

        for (let i = 1; i < waypoints.length; i++) {

            meters += surfaceDistance(

                waypoints[i - 1].coordinates,
                waypoints[i].coordinates

            );
        }

        return meters / 1000;
    }

// EXPORT CURRENT MISSION DATA

window.DEIMOS_MISSION = {

    getSnapshot() {

        function readMetric(id) {

            const value = parseFloat(
                document.getElementById(id).textContent
            );

            return Number.isFinite(value)
                ? value
                : null;
        }

        return {

            waypoints: waypoints.map(point => ({

                latitude: Cesium.Math.toDegrees(
                    point.coordinates.latitude
                ),

                longitude: Cesium.Math.toDegrees(
                    point.coordinates.longitude
                ),

                height: point.coordinates.height,

                position: point.position.clone()

            })),

            distance: readMetric("mission-distance"),
            duration: readMetric("mission-duration"),
            radiation: readMetric("mission-radiation"),
            slope: readMetric("mission-slope"),

            temperature:
                el("mission-temperature").textContent,

            speed: Number(el("mission-speed").value),

            scienceTime:
                Number(el("mission-science-time").value),

            roundTrip: el("mission-return").checked,

            galeReference: el("mission-gale").checked,

            objective: el("mission-objective").value,

            terrainReport: el("terrain-report").innerText

        };
    }
};


    // MISSION CALCULATIONS

    function updateMission() {

        el("mission-points").textContent =
            waypoints.length;

        const useGale = el("mission-gale").checked;

        const gale = NASA_DATA.regions.gale;

        el("mission-temperature").textContent =
            useGale
                ? `${gale.temperature.typicalDailyMinC} / ${gale.temperature.typicalDailyMaxC}`
                : "N/A";

        if (waypoints.length < 2) {

            el("mission-distance").textContent = "—";
            el("mission-duration").textContent = "—";
            el("mission-radiation").textContent = "—";

        } else {

            const speed = Number(
                el("mission-speed").value
            );

            const scienceMinutes = Number(
                el("mission-science-time").value
            );

            const returnTrip =
                el("mission-return").checked;

            const distance = calculateDistance() *
                (returnTrip ? 2 : 1);

            el("mission-distance").textContent =
                distance.toFixed(3);

            if (
                speed <= 0 ||
                scienceMinutes < 0 ||
                !Number.isFinite(speed) ||
                !Number.isFinite(scienceMinutes)
            ) {

                el("mission-duration").textContent = "—";
                el("mission-radiation").textContent = "—";

            } else {

                const duration =
                    distance / speed +
                    scienceMinutes / 60;

                el("mission-duration").textContent =
                    duration.toFixed(2);

                const exposure =
                    duration *
                    gale.radiation.doseMSvPerDay / 24;

                el("mission-radiation").textContent =
                    useGale
                        ? exposure.toFixed(3)
                        : "N/A";
            }
        }

        el("mission-waypoints").innerHTML =
            waypoints.map((point, index) => {

                const lat = Cesium.Math.toDegrees(
                    point.coordinates.latitude
                );

                const lon = Cesium.Math.toDegrees(
                    point.coordinates.longitude
                );

                return `
                    <p>
                        ${index === 0 ? "HABITAT" : "WP-" + index}
                        <br>
                        LAT: ${lat.toFixed(5)}°
                        <br>
                        LON: ${lon.toFixed(5)}°
                    </p>
                `;

            }).join("");
    }

    function routeChanged() {

        routeVersion++;

        drawRoute();
        updateMission();
        resetTerrain();
    }

    [
        "mission-speed",
        "mission-science-time",
        "mission-return",
        "mission-gale"

    ].forEach(id => {

        el(id).addEventListener(
            "input",
            updateMission
        );
    });


    // UNDO WAYPOINT

    el("undo-point").addEventListener("click", () => {

        if (!waypoints.length) return;

        waypoints.pop();

        viewer.entities.remove(markers.pop());

        routeChanged();

        status.textContent = "Last waypoint removed.";
    });


    // CLEAR ROUTE

    el("clear-route").addEventListener("click", () => {

        markers.forEach(marker =>
            viewer.entities.remove(marker)
        );

        markers = [];
        waypoints = [];

        routeChanged();

        status.textContent = "Route cleared.";
    });


    // RESET TERRAIN REPORT

    function resetTerrain() {

        el("mission-slope").textContent = "—";

        el("terrain-report").textContent =
            "Terrain not evaluated.";

        const canvas = el("elevation-chart");

        canvas.getContext("2d").clearRect(
            0, 0, canvas.width, canvas.height
        );
    }


    // SAMPLE REAL TERRAIN HEIGHTS

    async function analyzeTerrain() {

        if (waypoints.length < 2) {

            status.textContent =
                "Add at least two waypoints.";

            return;
        }

        

        const version = routeVersion;

        const totalMeters =
            calculateDistance() * 1000;

      if (totalMeters > 100000) {

    status.textContent =
        "Terrain analysis is limited to routes under 100 km.";

    return;
}

        const samples = [];
        const distances = [];

        let accumulated = 0;

        // Approximate sampling interval.
        // Actual spacing is recorded for slope calculations.

        const spacing = Math.max(
    463,
    totalMeters / 180
);

        for (let i = 1; i < waypoints.length; i++) {

            const geodesic = new Cesium.EllipsoidGeodesic(

                waypoints[i - 1].coordinates,
                waypoints[i].coordinates,

                ellipsoid
            );

            const length = geodesic.surfaceDistance;

            const steps = Math.max(
                1, Math.ceil(length / spacing)
            );

            for (let j = i === 1 ? 0 : 1;
                     j <= steps;
                     j++) {

                const fraction = j / steps;

                samples.push(
                    geodesic.interpolateUsingFraction(
                        fraction
                    )
                );

                distances.push(
                    accumulated + length * fraction
                );
            }

            accumulated += length;
        }

        const analyzeButton = el("analyze-terrain");

        analyzeButton.disabled = true;
analyzeButton.textContent = "Analyzing...";

status.textContent =
    "Sampling elevations from Mars 3D Tiles...";

el("terrain-report").textContent =
    `Retrieving ${samples.length} terrain samples...`;

console.log("DEIMOS: Terrain analysis started");
console.log("DEIMOS: Samples:", samples.length);
        try {

            const results = await MOLA.sampleRoute(samples);

console.log("NASA MOLA results:", results);

            if (version !== routeVersion) return;

            const valid = results.every(
                point =>
                    point &&
                    Number.isFinite(point.height)
            );

            if (!valid) {

                resetTerrain();

                el("terrain-report").textContent =
                    "Incomplete elevation coverage. Try a shorter route.";

                status.textContent =
                    "Some elevations could not be retrieved.";

                return;
            }

            const heights = results.map(
                point => point.height
            );

            let maxSlope = 0;
            let ascent = 0;
            let descent = 0;

            for (let i = 1; i < heights.length; i++) {

                const rise =
                    heights[i] - heights[i - 1];

                const run =
                    distances[i] - distances[i - 1];

                if (run <= 0) continue;

                const slope = Cesium.Math.toDegrees(

                    Math.atan(
                        Math.abs(rise) / run
                    )

                );

                maxSlope = Math.max(maxSlope, slope);

                if (rise > 0) {
                    ascent += rise;
                } else {
                    descent += Math.abs(rise);
                }
            }

            const minHeight = Math.min(...heights);
            const maxHeight = Math.max(...heights);

            el("mission-slope").textContent =
                `${maxSlope.toFixed(1)}°`;

            el("terrain-report").innerHTML = `

                Samples: ${heights.length}<br>

                Minimum model height:
                ${minHeight.toFixed(1)} m<br>

                Maximum model height:
                ${maxHeight.toFixed(1)} m<br>

                Outbound ascent:
                ${ascent.toFixed(1)} m<br>

                Outbound descent:
                ${descent.toFixed(1)} m<br><br>

                Terrain source: NASA MGS / MOLA MEGDR.<br>
Resolution: 128 pixels/degree.<br>
Elevation reference: Martian areoid.<br>

                Small obstacles may be unresolved.

            `;

            drawElevationChart(heights, distances);

            status.textContent =
                "Terrain analysis completed.";

        } catch (error) {

            if (version !== routeVersion) return;

            console.error(
                "DEIMOS TERRAIN ERROR:",
                error
            );
el("terrain-report").textContent = error.message;
            status.textContent =
                "Elevation sampling failed.";

        } finally {

    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze Terrain";
}
    }

    el("analyze-terrain").addEventListener(
        "click", analyzeTerrain
    );


    // ELEVATION PROFILE

    function drawElevationChart(heights, distances) {

        const canvas = el("elevation-chart");
        const ctx = canvas.getContext("2d");

        const width = canvas.width;
        const height = canvas.height;

        const padding = 24;

        const min = Math.min(...heights);
        const max = Math.max(...heights);

        const range = Math.max(max - min, 1);

        const distance =
            distances[distances.length - 1] || 1;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "#111B2E";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {

            const y = padding +
                i * (height - padding * 2) / 4;

            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 2;
        ctx.beginPath();

        heights.forEach((elevation, index) => {

            const x = padding +
                distances[index] / distance *
                (width - padding * 2);

            const y = height - padding -
                (elevation - min) / range *
                (height - padding * 2);

            if (index === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        ctx.fillStyle = "#94A3B8";
        ctx.font = "10px monospace";

        ctx.fillText(
            `${max.toFixed(0)} m`,
            8, 13
        );

        ctx.fillText(
            `${min.toFixed(0)} m`,
            8, height - 10
        );

        ctx.fillText(
            `${(distance / 1000).toFixed(2)} km`,
            width - 65,
            height - 10
        );
    }

    updateMission();

    console.log(
        "DEIMOS: Expedition Planner initialized."
    );
}
