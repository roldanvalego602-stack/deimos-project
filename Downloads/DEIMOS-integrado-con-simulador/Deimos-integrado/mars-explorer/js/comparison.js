
// DEIMOS PROJECT
// Scientific Route Comparison

function enableRouteComparison(viewer) {

    const el = id => document.getElementById(id);

    const panel = el("mission-panel");

    if (!panel || el("route-comparison")) return;

    const routes = [];

    let sequence = 0;

    const colors = [

        "#22D3EE",
        "#A78BFA",
        "#FBBF24",
        "#F87171",
        "#34D399"

    ];

    const section = document.createElement("section");

    section.id = "route-comparison";
    section.className = "route-comparison";

    section.innerHTML = `

        <h3>ROUTE COMPARISON</h3>

        <p class="comparison-note">
            Save alternative routes between the
            same habitat and scientific destination.
        </p>

        <button id="save-comparison-route">
            Save Current Route
        </button>

        <button id="clear-comparison-routes">
            Clear Saved Routes
        </button>

        <label>Comparison criterion</label>

        <select id="comparison-criterion">

            <option value="distance">
                Shortest distance
            </option>

            <option value="duration">
                Shortest duration
            </option>

            <option value="slope">
                Lowest sampled slope
            </option>

            <option value="radiation">
                Lowest estimated radiation
            </option>

        </select>

        <p id="comparison-status" role="status">
            No saved routes.
        </p>

        <div id="comparison-results"></div>

        <div id="comparison-recommendation"></div>

    `;

    panel.appendChild(section);


    // SAVE A ROUTE

    function saveRoute() {

        const mission =
            window.DEIMOS_MISSION?.getSnapshot();

        const status = el("comparison-status");

        if (!mission || mission.waypoints.length < 2) {

            status.textContent =
                "Create a route with at least two waypoints.";

            return;
        }

        if (mission.duration === null) {

            status.textContent =
                "Set valid mission parameters first.";

            return;
        }

        if (routes.length >= 5) {

            status.textContent =
                "Maximum of five saved routes.";

            return;
        }

        const id = ++sequence;

        const color = colors[
            (id - 1) % colors.length
        ];

        const route = {

            ...mission,

            id: id,

            name: `Route ${id}`,

            color: color,

            visible: true,

            entities: []

        };

        routes.push(route);

        drawSavedRoute(route);

        renderComparison();

        status.textContent =
            `${route.name} saved successfully.`;

        console.log(
            "DEIMOS: Saved route", route
        );
    }


    // DRAW ALTERNATIVE ROUTES

    function drawSavedRoute(route) {

        const color =
            Cesium.Color.fromCssColorString(
                route.color
            );

        const line = viewer.entities.add({

            polyline: {

                positions: route.waypoints.map(
                    point => point.position
                ),

                width: 4,

                material:
                    new Cesium.PolylineDashMaterialProperty({

                        color: color,
                        dashLength: 16

                    }),

                clampToGround: true,

                classificationType:
                    Cesium.ClassificationType.CESIUM_3D_TILE

            }

        });

        route.entities.push(line);


        // DESTINATION LABEL

        const destination =
            route.waypoints[
                route.waypoints.length - 1
            ];

        const label = viewer.entities.add({

            position: destination.position,

            label: {

                text: route.name,

                font: "13px monospace",

                fillColor: color,

                outlineColor:
                    Cesium.Color.BLACK,

                outlineWidth: 3,

                style:
                    Cesium.LabelStyle.FILL_AND_OUTLINE,

                pixelOffset:
                    new Cesium.Cartesian2(0, -36),

                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY

            }
        });

        route.entities.push(label);
    }


    // DISTANCE BETWEEN ENDPOINTS

    function endpointDistance(a, b) {

        const first =
            Cesium.Cartographic.fromDegrees(
                a.longitude, a.latitude
            );

        const second =
            Cesium.Cartographic.fromDegrees(
                b.longitude, b.latitude
            );

        const geodesic =
            new Cesium.EllipsoidGeodesic(

                first,
                second,
                Cesium.Ellipsoid.MARS

            );

        return geodesic.surfaceDistance;
    }


    // CHECK COMPARABLE ROUTES

    function comparable(a, b) {

        const startA = a.waypoints[0];
        const startB = b.waypoints[0];

        const endA =
            a.waypoints[a.waypoints.length - 1];

        const endB =
            b.waypoints[b.waypoints.length - 1];

        const tolerance = 50;

        return (

            endpointDistance(startA, startB)
                <= tolerance &&

            endpointDistance(endA, endB)
                <= tolerance &&

            a.speed === b.speed &&

            a.scienceTime === b.scienceTime &&

            a.roundTrip === b.roundTrip &&

            a.galeReference === b.galeReference &&

            a.objective === b.objective

        );
    }


    // FIND THE PREFERRED ROUTE

    function getPreferredRoute() {

        const criterion =
            el("comparison-criterion").value;

        if (routes.length < 2) return null;

        const compatible = routes.every(
            route => comparable(routes[0], route)
        );

        if (!compatible) return null;

        const complete = routes.every(
            route => Number.isFinite(route[criterion])
        );

        if (!complete) return null;

        return [...routes].sort(

            (a, b) =>
                a[criterion] - b[criterion]

        )[0];
    }


    // FORMAT SCIENTIFIC METRICS

    function format(value, decimals, unit) {

        return Number.isFinite(value)

            ? `${value.toFixed(decimals)} ${unit}`

            : "Not evaluated";
    }


    // RENDER SAVED ROUTES

    function renderComparison() {

        const preferred = getPreferredRoute();

        const criterion =
            el("comparison-criterion").value;

        el("comparison-results").innerHTML =

            routes.map(route => `

                <div class="comparison-card"
                     style="border-left-color:${route.color}">

                    <div class="comparison-card-header">

                        <strong style="color:${route.color}">
                            ${route.name}
                        </strong>

                        <button
                            data-remove-route="${route.id}">
                            ×
                        </button>

                    </div>

                    <div class="comparison-grid">

                        <div>
                            <small>DISTANCE</small>
                            <strong>
                                ${format(route.distance, 3, "km")}
                            </strong>
                        </div>

                        <div>
                            <small>DURATION</small>
                            <strong>
                                ${format(route.duration, 2, "h")}
                            </strong>
                        </div>

                        <div>
                            <small>MAX SAMPLED SLOPE</small>
                            <strong>
                                ${format(route.slope, 1, "°")}
                            </strong>
                        </div>

                        <div>
                            <small>ESTIMATED DOSE</small>
                            <strong>
                                ${format(route.radiation, 3, "mSv")}
                            </strong>
                        </div>

                    </div>

                    <label class="mission-checkbox">

                        <input type="checkbox"
                            data-visible-route="${route.id}"
                            ${route.visible ? "checked" : ""}>

                        Show on map

                    </label>

                    ${preferred?.id === route.id

                        ? `<p class="comparison-preferred">
                            Lowest value for selected criterion
                           </p>`

                        : ""

                    }

                </div>

            `).join("");


        // DISPLAY RECOMMENDATION

        const recommendation =
            el("comparison-recommendation");

        if (routes.length < 2) {

            recommendation.textContent =
                "Save at least two routes to compare.";

        } else if (!routes.every(
            route => comparable(routes[0], route)
        )) {

            recommendation.textContent =
                "Routes have different endpoints or mission parameters. A direct comparison is not available.";

        } else if (!preferred) {

            recommendation.textContent =
                "Complete the required analysis for all saved routes.";

        } else {

            const tied = routes.filter(
                route =>
                    route[criterion] === preferred[criterion]
            );

            const names = tied.map(
                route => route.name
            ).join(", ");

            recommendation.innerHTML = `

                <strong>PREFERRED BY CRITERION</strong>

                <h2>${names}</h2>

                <p>
                    Lowest ${criterion} among
                    comparable saved routes.
                </p>

                <p class="comparison-note">
                    This does not establish that the
                    selected route is safe.
                </p>

            `;
        }


        // DELETE INDIVIDUAL ROUTES

        document.querySelectorAll(
            "[data-remove-route]"
        ).forEach(button => {

            button.addEventListener("click", () => {

                const id = Number(
                    button.dataset.removeRoute
                );

                removeRoute(id);

            });
        });


        // TOGGLE ROUTE VISIBILITY

        document.querySelectorAll(
            "[data-visible-route]"
        ).forEach(input => {

            input.addEventListener("change", () => {

                const route = routes.find(

                    item =>
                        item.id === Number(
                            input.dataset.visibleRoute
                        )

                );

                if (!route) return;

                route.visible = input.checked;

                route.entities.forEach(entity => {

                    entity.show = route.visible;

                });
            });
        });
    }


    // REMOVE A SAVED ROUTE

    function removeRoute(id) {

        const index = routes.findIndex(
            route => route.id === id
        );

        if (index === -1) return;

        routes[index].entities.forEach(entity => {

            viewer.entities.remove(entity);

        });

        routes.splice(index, 1);

        renderComparison();

        el("comparison-status").textContent =
            "Saved route removed.";
    }


    // CLEAR ALL SAVED ROUTES

    function clearRoutes() {

        routes.forEach(route => {

            route.entities.forEach(entity => {

                viewer.entities.remove(entity);

            });
        });

        routes.length = 0;

        sequence = 0;

        renderComparison();

        el("comparison-status").textContent =
            "All saved routes cleared.";
    }


    // EVENTS

    el("save-comparison-route").addEventListener(
        "click", saveRoute
    );

    el("clear-comparison-routes").addEventListener(
        "click", clearRoutes
    );

    el("comparison-criterion").addEventListener(
        "change", renderComparison
    );

    renderComparison();

    console.log(
        "DEIMOS: Route Comparison initialized."
    );
}
