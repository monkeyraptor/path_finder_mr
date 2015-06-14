/*! Path Finder - created on 2015-04-18
 * By Monkey Raptor http://monkeyraptor.johanpaul.net
 * A* algorithm with Manhattan scoring style plus shuffling array
 * MIT license */

// Cleaned on 2015-06-14 using JSLint (jslint.com) - browser option

// This is with the HTML elements names defined on the HTML/CSS
// HTML and CSS at http://thor.johanpaul.net/path_finding (demo). Look at the page source.

//global variables
var AI, trigger, g_s, build, misc;

//AI PART
AI = {
    v: {
        d_array: [],
        d_card_array: [],
        d_coordinate: {
            north: [0, -1],
            east: [1, 0],
            south: [0, 1],
            west: [-1, 0]
        },
        finished: 0,
        e_path: [],
        sf: {},
        t_c: 0,
        walls: [],
        walls_path: [],
        time_start: 0,
        time_end: 0,
        s_sf: {},
        traceback: 0,
        no_path: 0
    },

    init: function (a, b) {
        "use strict";
        var color = misc.slc(".point"),
            l = color.length,
            start = "point start",
            end = "point end white",
            wall = "point obs",
            find_btn = misc.gid("find"),
            object = build.v.object;

        if (!a) {
            find_btn.disabled = 1;
            find_btn.innerHTML = "Finding";
            AI.run(object, b);
        } else {
            //reset path, but leave obstacles intact
            find_btn.disabled = 0;
            find_btn.innerHTML = "Find path, please";
            b.disabled = 1;

            color.forEach(function (v) {
                if (v.className !== start &&
                        v.className !== end &&
                        v.className !== wall) {
                    v.className = "point";
                }
            });

            color[l - 1].className = "point end";

            //reset AI global variables
            AI.v.walls_path = [];
            AI.v.e_path = [];
            AI.v.time_start = 0;
            AI.v.time_end = 0;
            AI.v.t_c = 0;
            AI.v.traceback = 0;
            AI.v.no_path = 0;

            //reset others
            misc.reconstruct();
        }
    },

    run: function (b) {
        "use strict";
        AI.v.time_start = misc.clock();
        misc.init_AI(b); //button and tiles
        AI.calculate(); //start calculation
    },

    calculate: function () {
        "use strict";
        //calculate() global variables
        var obj, d_c, sf, start_coordinate, finish_coordinate, d_a, d_a_c, e_p, g_x, g_y, last_elm, arr, interval, dur, count;

        obj = build.v.object; //object coordinates
        d_c = AI.v.d_coordinate; //movement reference (static)
        sf = AI.v.sf; //start-finish object (dynamic)
        start_coordinate = sf.start; //start coordinate
        finish_coordinate = sf.finish; //finish coordinate
        d_a = AI.v.d_array; //object path (global)
        d_a_c = AI.v.d_card_array; //path direction (global)
        e_p = AI.v.e_path; //DOM elm path (global)
        g_x = g_s.columns;
        g_y = g_s.rows;
        last_elm = "";
        arr = []; //current moves scores
        interval = "";
        dur = 50;
        count = -1;

        //-----------------------
        function set_DOM() {
            misc.set_DOM(interval, count, e_p, dur, finish_coordinate, d_a, d_a_c);
        }

        //***************************
        function retry() {
            //console.log("retrying");
            var start = AI.v.s_sf; //get the static
            AI.v.t_c += 1;
            AI.v.sf = start; //put it to dynamic

            //>>>>>>>>>>>>>>
            AI.calculate();
            //>>>>>>>>>>>>>>
        }
        //-----------------------
        function finished_handler(a, b) {
            var card_delta = b.length - a.length,
                i = 0;

            AI.v.time_end = misc.clock();

            if (!AI.v.e_path.length) {
                a.forEach(function (v) {
                    AI.v.e_path.push(misc.gid(v[0] + "_" + v[1]));
                });
            }

            //reconstruct directions array
            b.splice(0, card_delta);

            //add direction attribute
            while (i < b.length - 1) {
                misc.gid(a[i][0] + "_" + a[i][1]).setAttribute("data-direction", b[i + 1]);
                i += 1;
            }

            //initialize the timer FX
            set_DOM();
        }
        //-----------------------
        function retrace(a, b, str, last_elm, dac) {
            //d_a,  obj,  sf.start, last_elm, d_a_c
            //a,    b,    str,      last_elm, dac
            //console.log("retracing");
            var l, x, y, xx, yy;

            misc.mark_early_path(); //mark earlier failed try out (DOM)

            AI.v.traceback += 1;

            if (!!a.length && !!dac.length) {
                l = a.length - 1;
                x = a[l][0];
                y = a[l][1];

                //put boundary
                b[x][y] = "wall";
                AI.v.walls.push([x, y]);
                str[0] = x;
                str[1] = y;

                //object path manipulation
                last_elm = a[0];
                a.splice(0, 0, last_elm);
                a.pop();

                //directive ..
                dac.splice(0, 1, "test");
                dac.pop();

                //>>>>>>>>>>>>>>>>>>>
                AI.calculate();
                //>>>>>>>>>>>>>>>>>>>

            } else if (!!a.length && !dac.length) {
                a.forEach(function (v) {
                    xx = v[0];
                    yy = v[1];
                    AI.v.walls_path.push([xx, yy]);
                    b[xx][yy] = "wall_path";
                });

                a.splice(0, a.length);

                //<<<<<<<<<<<<<<<<<<<
                retry(); //re-trace from beginning
                //<<<<<<<<<<<<<<<<<<<

            } else {
                AI.v.no_path += 1;
                if (AI.v.t_c < 2 * g_s.columns * g_s.rows) {
                    //<<<<<<<<<<<<<<<<<<<
                    misc.reconstruct();
                    //<<<<<<<<<<<<<<<<<<<
                } else {
                    misc.weak_handler(); //fallback for break down
                }
            }
        }

        //-----------------------
        function choose() {
            if (!AI.v.finished && !!arr.length) {
                misc.sorter(arr); //sorting moves
                var values = arr[0].split("_"), //choosing lowest score
                    cr = values[values.length - 1].split(","), //coordinate
                    d_card = values[values.length - 2], //directive

                    now = []; //current move chosen

                AI.v.traceback = 0;

                start_coordinate[0] = Number(cr[0]);
                start_coordinate[1] = Number(cr[1]);
                now[0] = start_coordinate[0];
                now[1] = start_coordinate[1];

                if (!isNaN(obj[start_coordinate[0]][start_coordinate[1]])) {
                    obj[start_coordinate[0]][start_coordinate[1]] = "path";
                }

                d_a.push(now); //object path
                d_a_c.push(d_card); //directive path

                //this to restart the LOOP
                //>>>>>>>>>>>>>>>>>>>>>>>>
                AI.calculate();
                //>>>>>>>>>>>>>>>>>>>>>>>>

            } else if (!AI.v.finished && !arr.length) {

                if (AI.v.no_path < 2 * g_s.columns * g_s.rows) {
                    AI.v.traceback = 1;
                    retrace(d_a, obj, sf.start, last_elm, AI.v.finished, d_a_c);

                } else {
                    misc.no_path_handler();
                }

            }

        }

        //***********************
        function bound(a, b) {
            var check_value = 0;
            if (a >= 0 && a < g_x && b >= 0 && b < g_y) {
                check_value = 1;
            }
            return check_value;
        }

        function open_node(a, b) {
            var check_value = 0;
            if (!!obj[a]) {
                if (!isNaN(obj[a][b])) {
                    check_value = 1;
                }
            }
            return check_value;
        }

        function finish(a, b) {
            var check_value = 0;
            if (!!obj[a]) {
                if (obj[a][b] === "end") {
                    check_value = 1;
                }
            }
            return check_value;
        }

        //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        function ver_hor(a, b, directive, score_g) {
            var f, g, h, gh,
                    xy = [a, b],
                    distance_x = finish_coordinate[0] - a > 0
                ? (finish_coordinate[0] - a)
                : -1 * (finish_coordinate[0] - a),
                    distance_y = finish_coordinate[1] - b > 0
                ? (finish_coordinate[1] - b)
                : -1 * (finish_coordinate[1] - b);

            if (!!bound(a, b) && !!open_node(a, b) && !finish(a, b)) {
                g = score_g;
                h = (distance_x + distance_y) * g;
                gh = g + h;
                f = gh + "_" + directive + "_" + xy;
                arr.push(f);

            } else if (!!finish(a, b)) {
                AI.v.finished = 1;
                finished_handler(AI.v.d_array, AI.v.d_card_array);
            }

        }

        //***********************
        //directions
        function north() {
            var x = d_c.north[0],
                y = d_c.north[1],
                c_x = start_coordinate[0] + x, //north coordinate
                c_y = start_coordinate[1] + y; //

            ver_hor(c_x, c_y, "north", 10);

        }

        function east() {
            var x = d_c.east[0],
                y = d_c.east[1],
                c_x = start_coordinate[0] + x, //east coordinate
                c_y = start_coordinate[1] + y;

            ver_hor(c_x, c_y, "east", 10);

        }

        function south() {
            var x = d_c.south[0],
                y = d_c.south[1],
                c_x = start_coordinate[0] + x, //south coordinate
                c_y = start_coordinate[1] + y; //

            ver_hor(c_x, c_y, "south", 10);

        }

        function west() {
            var x = d_c.west[0],
                y = d_c.west[1],
                c_x = start_coordinate[0] + x, //west coordinate
                c_y = start_coordinate[1] + y; //

            ver_hor(c_x, c_y, "west", 10);

        }

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //init lookup
        function lookup() {
            var card_0 = [east, north, west, south],
                card_1 = [south, west, north, east],
                card_2 = [west, east, north, south],
                card_3 = [north, south, east, west],
                cardin = [card_0, card_1, card_2, card_3],
                cardinal;

            if (AI.v.traceback === 0) {
                if (!!AI.v.walls.length) {
                    //"quarter" shuffle
                    cardinal = misc.shuffle(cardin[0]);
                    cardinal = misc.shuffle(misc.shuffle(cardinal));
                } else {
                    //"really" shuffle
                    cardinal = misc
                        .shuffle(cardin[Math.floor(Math.random() * cardin.length)]);
                }
            } else {
                if (AI.v.traceback - 1 < cardin.length - 1) {
                    //this can be just shuffle or go to other handler
                    cardinal = misc
                        .shuffle(cardin[Math.floor(Math.random() * cardin.length)]);

                } else if (AI.v.traceback - 1 >= cardin.length - 1 &&
                        AI.v.traceback - 1 < cardin.length + 1) {
                    //this can be just shuffle or go to other handler
                    cardinal = misc
                        .shuffle(cardin[Math.floor(Math.random() * cardin.length)]);

                } else {
                    misc.weak_handler();
                }
            }
            cardinal.forEach(function (v) {
                v();
            });
            choose();
        }
        lookup(); //run lookup()
    }
};

//*******************************************************************
//MISC FUNCTION PART
misc = {
    init_AI: function (b) {
        "use strict";
        var po = misc.slc(".point"),
            rebuild_button = misc.gid("rebuild"),
            clear_btn = misc.gid("clear");

        //disable start(find) button
        b.disabled = 1;
        rebuild_button.disabled = 1;
        clear_btn.disabled = 1;
        b.innerHTML = "Finding";

        //remove inline "onclick" trigger on each tile
        po.forEach(function (v) {
            v.removeAttribute("onclick");
        });
    },

    sorter: function (a) {
        "use strict";
        return a.sort(function (p, q) {
            return parseInt(p, 10) - parseInt(q, 10);
        });
    },

    set_DOM: function (a, b, c, d, e) {
        "use strict";
        var title = misc.gid("title"),
            btn = misc.gid("find"),
            rebuild_btn = misc.gid("rebuild"),
            clear_btn = misc.gid("clear"),
            n_c = c; //path DOM array (global)

        //pick last direction
        function comparer(a, b) {
            var x = b[0],
                y = b[1],
                ob = a.getAttribute("id").split("_"),
                x_ob = Number(ob[0]),
                y_ob = Number(ob[1]),
                calc_x = x - x_ob,
                calc_y = y - y_ob,
                value;

            //only four cardinals
            if (calc_y === 0) {
                value = "east";
            } else if (calc_x === 0) {
                value = "south";
            }
            return value;
        }

        //interval, count, AI.v.e_path, dur (a, b, c, d, e, ee)
        function tiles_FX() {
            var delta_time,
                path_tiles;
            b += 1;
            if (b < n_c.length) {

                misc.s_cl(n_c[b], "point path");
                misc.s_ti(n_c[b], b + 1);

                if (!!n_c[b].getAttribute("data-direction")) {
                    n_c[b].innerHTML = n_c[b].getAttribute("data-direction");
                } else {
                    n_c[b].innerHTML = comparer(n_c[b], AI.v.sf.finish);
                }

            } else {
                delta_time = AI.v.time_end - AI.v.time_start;
                path_tiles = misc.slc(".point.path").length;
                misc.s_cl(misc.gid(e[0] + "_" + e[1]), "point end white smiley");

                title.innerHTML =
                        "Path Finding<br><sub style='color:white'>Calculated in " + delta_time +
                        " ms | " + path_tiles + " steps between start - finish</sub>";

                title.style.background = "deepskyblue";
                btn.innerHTML = "Finished";
                rebuild_btn.disabled = 0;
                clear_btn.disabled = 0;
                AI.v.traceback = 0;
                clearInterval(a);
            }
        }
        a = setInterval(tiles_FX, d); //run FX timer
    },

    weak_handler: function () {
        "use strict";
        var title = misc.gid("title"),
            tiles = misc.slc(".point"),
            rebuild_btn = misc.gid("rebuild"),
            start_btn = misc.gid("find"),
            delta_time;

        AI.v.time_end = misc.clock();

        delta_time = (AI.v.time_end - AI.v.time_start) / 1000;
        delta_time = delta_time.toFixed(2);

        title.innerHTML =
                "Not capable calculating<br><sub style='color:purple'>Boohoohoo</sub>" +
                "<br><sub style='color:white'>" + delta_time + " s</sub>";
        title.style.background = "violet";

        rebuild_btn.disabled = 0;
        start_btn.disabled = 1;
        start_btn.innerHTML = "Gosh darn it";

        tiles.forEach(function (v) {
            if (v.className === "point") {
                v.className = "point boo";
            }
        });

        misc.mark_early_path();
    },

    mark_early_path: function () {
        "use strict";
        var wp = AI.v.walls_path,
            elm;
        wp.forEach(function (v) {
            elm = misc.gid(v[0] + "_" + v[1]);
            if (!elm.className.match("obs")) {
                elm.className = "point poo";
            }
        });
    },

    no_path_handler: function () {
        "use strict";
        var title = misc.gid("title"),
            tiles = misc.slc(".point"),
            rebuild_btn = misc.gid("rebuild"),
            start_btn = misc.gid("find");

        title.innerHTML = "Path Finding<br><sub style='color:yellow'>woops, NO PATH</sub>";
        title.style.background = "darkred";
        rebuild_btn.disabled = 0;
        start_btn.innerHTML = "Cannot find it...";
        start_btn.disabled = 1;
        tiles.forEach(function (v) {
            if (v.className === "point") {
                v.className = "point no";
            }
        });

        misc.mark_early_path();
    },

    shuffle: function (a) {
        "use strict";
        var aa = a.slice(),
            new_a = [],
            index;
        a.forEach(function () {
            index = Math.floor(Math.random() * aa.length);
            new_a.push(aa[index]);
            aa.splice(index, 1);
        });
        return new_a;
    },

    clear: function () {
        "use strict";
        var i = 0,
            j,
            k = 0,
            point = misc.slc(".point"),
            obj = build.v.object,
            x = g_s.columns,
            y = g_s.rows,
            title = misc.gid("title"),
            elm;

        //reset title
        title.innerHTML = "Path Finding<br><sub style='color:#999'>Visualization</sub>";
        title.style.background = "white";

        //loop for reset bunch of things
        while (i < x) {
            j = 0;
            while (j < y) {
                elm = misc.gid(i + "_" + j);
                //reset DOM coordinate
                elm.innerHTML = i + ", " + j;
                elm.removeAttribute("data-direction");

                //reset object coordinate
                if (obj[i][j] === "path" || obj[i][j] === "wall_path") {
                    obj[i][j] = j;
                }
                j += 1;
            }
            i += 1;
        }
        //re-add "onclick" trigger
        while (k < x * y) {
            if (point[k].className === "point" || point[k].className === "point obs") {
                point[k].setAttribute("onclick", "trigger.mark(this)");
            }
            k += 1;
        }
    },

    reconstruct: function () {
        "use strict";
        //reset some variables
        build.v.array = [];
        AI.v.d_card_array = [];
        AI.v.d_array = [];
        AI.v.e_path = [];
        AI.v.sf = {
            start: [0, 0],
            finish: [g_s.columns - 1, g_s.rows - 1]
        };
        AI.v.s_sf = {
            start: [0, 0],
            finish: [g_s.columns - 1, g_s.rows - 1]
        };
        AI.v.traceback = 0;

        var blockades = AI.v.walls_path,
            obj = build.v.object,
            x,
            y;
        blockades.forEach(function (v) {
            x = v[0];
            y = v[1];
            obj[x][y] = y;
        });

        blockades = []; //reset current failed directions array

        if (!AI.v.finished) {
            AI.calculate(); //recalculate
        } else {
            AI.v.finished = 0; //restart finished flag
            misc.clear(); //clear path
        }
    },

    slc: function (a) {
        "use strict";
        return Array.prototype.slice.call(document.querySelectorAll(a));
    },

    gid: function (a) {
        "use strict";
        return document.getElementById(a);
    },

    ga_id: function (a) {
        "use strict";
        return a.getAttribute("id");
    },

    s_ti: function (a, b) {
        "use strict";
        a.setAttribute("title", b);
    },

    s_cl: function (a, b) {
        "use strict";
        a.setAttribute("class", b);
    },

    clock: function () {
        "use strict";
        var p = new Date(),
            ms = p.getTime();
        return ms;
    }
};

//*******************************************************************
//GRID BUILDER PART
build = {
    v: {
        array: [],
        object: {}
    },

    filler: function (i, y, d) {
        "use strict";
        var j = 0,
            k = 0,
            ar = [],
            arr = [];
        while (j < y) {
            ar.push("<div class='point' style='height:" + d +
                    "px;width:" + d + "px;line-height:" + d +
                    "px' id='" + i + "_" + j +
                    "' onclick='trigger.mark(this)'>" + i +
                    ", " + j + "</div>");
            j += 1;
        }
        do {
            arr.push(k);
            k += 1;
        } while (k < y);

        return [ar.join(""), arr];
    },

    //********************************************
    //Create start and finish points
    //********************************************
    markers: function (a, b, object) {
        "use strict";
        var points = misc.slc(".point"),
            //finish coordinate
            en = [a - 1, b - 1],
            //buttons
            btn_1 = misc.gid("find"),
            btn_2 = misc.gid("rebuild");

        btn_1.disabled = 0;
        btn_2.disabled = 0;
        btn_1.innerHTML = "Find path, please";

        //start point (northwest corner)
        misc.s_cl(points[0], "point start");
        misc.s_ti(points[0], "Start point");
        points[0].removeAttribute("onclick");
        object[0][0] = "start";


        //finish point (southeast corner)
        misc.s_cl(points[a * b - 1], "point end");
        misc.s_ti(points[a * b - 1], "End point");
        points[a * b - 1].removeAttribute("onclick");
        object[en[0]][en[1]] = "end";

        //START and FINISH (END) points
        AI.v.sf.start = [0, 0]; //later, it'll be dynamic
        AI.v.sf.finish = en; //static

        AI.v.s_sf.start = [0, 0]; //static
        AI.v.s_sf.finish = en; //static
    },

    check_DOM: function (x, y, object, interval) {
        "use strict";
        if (!!misc.slc(".point").length) {
            build.markers(x, y, object);
            clearInterval(interval);
        }
    },

    //Init builder
    run: function (col, row, size) {
        "use strict";
        var i = 0,
            x = col,
            y = row,
            d = size,
            wrapper = misc.gid("outer"),
            array = build.v.array,
            object = build.v.object,
            interval;

        //fill the object and DOM
        do {
            object[i] = build.filler(i, y, d)[1];
            array.push("<div class='wrap'>" +
                    build.filler(i, y, d)[0] +
                    "</div>");
            i += 1;
        } while (i < x);

        //place elements on DOM
        wrapper.innerHTML = array.join("");
        //set grid wrapper fixed size
        wrapper.style.width = x * d + "px";
        wrapper.style.height = y * d + "px";

        //check DOM
        interval = setInterval(function () {
            build.check_DOM(x, y, object, interval);
        }, 10);
    }
};

//*******************************************************************
//Click handlers
trigger = {
    mark: function (a) {
        "use strict";
        var obj = build.v.object,
            c_id = misc.ga_id(a).split("_"),
            x = Number(c_id[0]),
            y = Number(c_id[1]),
            coord_obj = [x, y],
            walls = AI.v.walls;

        if (a.className === "point obs") {
            obj[x][y] = y;
            a.className = "point";
            walls.forEach(function (v, i) {
                if (v.toString() === coord_obj.toString()) {
                    walls.splice(i, 1);
                }
            });
        } else if (a.className === "point") {
            walls.push([x, y]);
            obj[x][y] = "wall";
            a.className = "point obs";
        }
    },

    reset: function () {
        "use strict";
        var btn_1 = misc.gid("find"),
            btn_2 = misc.gid("rebuild"),
            btn_3 = misc.gid("clear"),
            title = misc.gid("title");

        //reset everything
        build.v.object = {};
        build.v.array = [];

        AI.v.d_array = [];
        AI.v.d_card_array = [];
        AI.v.e_path = [];
        AI.v.sf = {};
        AI.v.s_sf = {};
        AI.v.finished = 0;
        AI.v.t_c = 0;
        AI.v.walls = [];
        AI.v.walls_path = [];
        AI.v.traceback = 0;
        AI.v.no_path = 0;
        title.innerHTML = "Path Finding<br><sub style='color:#999'>Visualization</sub>";
        title.style.background = "white";

        //disable button
        btn_1.disabled = 1;
        btn_2.disabled = 1;
        btn_3.disabled = 1;

        //run builder on grid reset
        build.run(g_s.columns, g_s.rows, g_s.square_size);
    }
};

//*******************************************************************
//INIT PART
//Grids global setting
g_s = {
    columns: 13, //x
    rows: 7, //y
    square_size: 36
};

//Run grid builder for the 1st time
build.run(g_s.columns, g_s.rows, g_s.square_size);
