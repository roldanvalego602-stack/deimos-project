
// DEIMOS PROJECT
// NASA Scientific Reference Database

const NASA_DATA = {

    mars: {
        meanRadiusKm: 3389.5,
        gravity: 3.73,

        source:
            "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },

    referenceMission: {
        outboundDays: 180,
        surfaceDays: 500,
        returnDays: 180,
        estimatedRadiationMSv: 1000,

        source:
            "https://science.nasa.gov/resource/radiation-exposure-comparisons-with-mars-trip-calculation/"
    },

    landing: {
        mission: "Mars 2020 Perseverance",
        durationMinutes: 7,
        entrySpeedKmh: 20000,
        historical: true,

        source:
            "https://science.nasa.gov/resource/perseverance-rovers-entry-descent-and-landing-profile/"
    },

    regions: {

        gale: {

            name: "Gale Crater",

            scientificObjective:
                "Study sedimentary rocks and ancient habitable environments.",

            radiation: {
                mission: "Curiosity",
                instrument: "RAD",
                doseMSvPerDay: 0.67,
                absorbedDoseUGyPerDay: 210,
                period: "August 2012 - June 2013",

                source:
                    "https://science.nasa.gov/resource/radiation-measurements-on-mars/",

                doseSource:
                    "https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/"
            },

            temperature: {
                mission: "Curiosity",
                instrument: "REMS",
                typicalDailyMinC: -70,
                typicalDailyMaxC: 0,
                period: "August 2012 - February 2013",

                source:
                    "https://science.nasa.gov/resource/steady-temperatures-at-mars-gale-crater/"
            },

            solarEvent: {
                date: "2024-05-20",
                absorbedDoseUGy: 8100,

                source:
                    "https://ciencia.nasa.gov/sistema-solar/marte-se-ilumina-durante-una-tormenta-solar-extrema/"
            }
        }
    }
};

console.log("DEIMOS: NASA reference database loaded.");
