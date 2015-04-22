/*! Path Finder - 2015-04-18
 * By Monkey Raptor http://monkeyraptor.johanpaul.net
 * A* algorithm with Manhattan scoring style plus shuffling array
 * MIT license */
 
// This is with the HTML elements names defined on the HTML/CSS
// Demo at http://thor.johanpaul.net/path_finding. Look at the page source.

//I didn't "clean" this up. Like, consistency and all that.
//This was a "learning time", sort of speak.

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

    init: function(a, b) {
        var i = 0,
            color = misc.slc(".point"),
            l = color.length,
            start = "point start",
            end = "point end white",
            wall = "point obs",
            find_btn = misc.gid("find"),
            object = build.v.object;

        if (!a) {
            find_btn.disabled = 1;
            find_btn.innerHTML = "Finding";
            this.run(object, b);
        } else {
            //reset path, but leave obstacles intact
            find_btn.disabled = 0;
            find_btn.innerHTML = "Find path, please";
            b.disabled = 1;

            for (i; i < l; i++) {
                if (color[i].className !== start &&
                    color[i].className !== end &&
                    color[i].className !== wall) {
                    color[i].className = "point";
                }
            }

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

    run: function(b) {
        AI.v.time_start = misc.clock();
        misc.init_AI(b); //button and tiles          
        this.calculate(); //start calculation
    },

    calculate: function() {
        //calculate() global variables
        var obj = build.v.object, //global object coordinates

            d_c = this.v.d_coordinate, //movement reference (static)

            sf = this.v.sf, //start-finish object (dynamic)
            _s = sf.start, //start coordinate
            _f = sf.finish, //finish coordinate

            d_a = this.v.d_array, //object path (global)
            d_a_c = this.v.d_card_array, //path direction (global)
            e_p = this.v.e_path, //DOM elm path (global)

            g_x = g_s.columns,
            g_y = g_s.rows,

            last_elm,

            arr = [], //current moves scores

            interval,
            dur = 50,
            count = -1;

        //-----------------------   
        function set_DOM() {
            misc.set_DOM(interval, count, e_p, dur, _f, d_a, d_a_c);
        }

        //***************************
        function retry() {

                //console.log("retrying");
                var start = AI.v.s_sf; //get the static
                AI.v.t_c++;
                AI.v.sf = start; //put it to dynamic

                //>>>>>>>>>>>>>>
                AI.calculate();
                //>>>>>>>>>>>>>>
            }
            //-----------------------          
        function finished_handler(a, b) {
                AI.v.time_end = misc.clock();

                var i = 0,
                    m = 0,
                    card_delta = b.length - a.length;

                if (!AI.v.e_path.length) {
                    for (i; i < a.length; i++) {
                        AI.v.e_path.push(misc.gid(a[i][0] + "_" + a[i][1]));
                    }
                }

                //reconstruct directions array
                b.splice(0, card_delta);

                //add direction attribute
                for (m; m < b.length; m++) {
                    if (m < b.length - 1) {
                        misc.gid(a[m][0] + "_" + a[m][1]).setAttribute("data-direction", b[m + 1]);
                    }
                }

                //initialize the timer FX
                set_DOM();
            }
            //-----------------------  
        function retrace(a, b, str, last_elm, dac) {
            //d_a,  obj,  sf.start, last_elm, d_a_c
            //a,    b,    str,      last_elm, dac
            //console.log("retracing");
            var l, x, y, xx, yy, i = 0;

            misc.mark_early_path(); //mark earlier failed try out (DOM)

            AI.v.traceback++;

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
                for (i; i < a.length; i++) {
                    xx = a[i][0];
                    yy = a[i][1];
                    AI.v.walls_path.push([xx, yy]);
                    b[xx][yy] = "wall_path";
                }

                a.splice(0, a.length);

                //<<<<<<<<<<<<<<<<<<<
                retry(); //re-trace from beginning
                //<<<<<<<<<<<<<<<<<<<

            } else {
                AI.v.no_path++;
                if (AI.v.t_c < g_s.columns * g_s.rows) {
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

                _s[0] = Number(cr[0]);
                _s[1] = Number(cr[1]);
                now[0] = _s[0];
                now[1] = _s[1];

                if (!isNaN(obj[_s[0]][_s[1]])) {
                    obj[_s[0]][_s[1]] = "path";
                }

                d_a.push(now); //object path
                d_a_c.push(d_card); //directive path

                //this to restart the LOOP
                //>>>>>>>>>>>>>>>>>>>>>>>>
                AI.calculate();
                //>>>>>>>>>>>>>>>>>>>>>>>>

            } else if (!AI.v.finished && !arr.length) {

                if (AI.v.no_path < g_s.columns * g_s.rows) {
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
                distance_x =
                _f[0] - a > 0 ? (_f[0] - a) : -1 * (_f[0] - a),
                distance_y =
                _f[1] - b > 0 ? (_f[1] - b) : -1 * (_f[1] - b);

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
                c_x = _s[0] + x, //north coordinate
                c_y = _s[1] + y; //

            ver_hor(c_x, c_y, "north", 10);

        }

        function east() {
            var x = d_c.east[0],
                y = d_c.east[1],
                c_x = _s[0] + x, //east coordinate
                c_y = _s[1] + y;

            ver_hor(c_x, c_y, "east", 10);

        }

        function south() {
            var x = d_c.south[0],
                y = d_c.south[1],
                c_x = _s[0] + x, //south coordinate
                c_y = _s[1] + y; //

            ver_hor(c_x, c_y, "south", 10);

        }

        function west() {
            var x = d_c.west[0],
                y = d_c.west[1],
                c_x = _s[0] + x, //west coordinate
                c_y = _s[1] + y; //

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
                cardinal,
                i = 0,
                ln;

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

            ln = cardinal.length;

            for (i; i < ln; i++) {
                cardinal[i]();
            }
            choose();
        }
        lookup(); //run lookup()
    }
};

//*******************************************************************    
//MISC FUNCTION PART
misc = {
    init_AI: function(b) {
        var i = 0,
            po = this.slc(".point"),
            rebuild_button = this.gid("rebuild"),
            clear_btn = this.gid("clear"),
            l = po.length;

        //disable start(find) button
        b.disabled = rebuild_button.disabled = clear_btn.disabled = 1;
        b.innerHTML = "Finding";

        //remove inline "onclick" trigger on each tile
        for (i; i < l; i++) {
            po[i].removeAttribute("onclick");
        }
    },

    sorter: function(a) {
        a.sort(function(p, q) {
            return parseInt(p, 10) - parseInt(q, 10);
        });
        return a;
    },

    set_DOM: function(a, b, c, d, e) {
        var title = this.gid("title"),
            btn = this.gid("find"),
            rebuild_btn = this.gid("rebuild"),
            clear_btn = this.gid("clear"),
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
            b++;
            if (b < n_c.length) {

                misc.s_cl(n_c[b], "point path");
                misc.s_ti(n_c[b], b + 1);

                if (!!n_c[b].getAttribute("data-direction")) {
                    n_c[b].innerHTML = n_c[b].getAttribute("data-direction");
                } else {
                    n_c[b].innerHTML = comparer(n_c[b], AI.v.sf.finish);
                }

            } else {
                var delta_time = AI.v.time_end - AI.v.time_start;

                misc.s_cl(misc.gid(e[0] + "_" + e[1]), "point end white smiley");

                var path_tiles = misc.slc(".point.path").length;

                title.innerHTML =
                    "Path Finding<br><sub style='color:white'>Calculated in " + delta_time +
                    " ms | " + path_tiles + " steps between start - finish</sub>";

                title.style.background = "deepskyblue";

                btn.innerHTML = "Finished";

                rebuild_btn.disabled = clear_btn.disabled = 0;

                AI.v.traceback = 0;

                clearInterval(a);
            }
        }
        a = setInterval(tiles_FX, d); //run FX timer
    },

    weak_handler: function() {
        var title = misc.gid("title"),
            tiles = misc.slc(".point"),
            rebuild_btn = misc.gid("rebuild"),
            start_btn = misc.gid("find"),
            i = 0,
            delta_time;

        AI.v.time_end = misc.clock();

        delta_time = ((AI.v.time_end - AI.v.time_start) / 1000).toFixed(2);

        title.innerHTML =
            "Not capable calculating<br><sub style='color:purple'>Boohoohoo</sub>" +
            "<br><sub style='color:white'>" + delta_time + " s</sub>";
        title.style.background = "violet";

        rebuild_btn.disabled = 0;
        start_btn.disabled = 1;
        start_btn.innerHTML = "Gosh darn it";

        for (i; i < tiles.length; i++) {
            if (tiles[i].className === "point") {
                tiles[i].className = "point boo";
            }
        }

        this.mark_early_path();
    },

    mark_early_path: function() {
        var j = 0,
            wp = AI.v.walls_path,
            ln = wp.length,
            elm;
        for (j; j < ln; j++) {
            elm = this.gid(wp[j][0] + "_" + wp[j][1]);
            if (!elm.className.match("obs")) {
                elm.className = "point poo";
            }
        }
    },

    no_path_handler: function() {
        var title = misc.gid("title"),
            tiles = misc.slc(".point"),
            rebuild_btn = misc.gid("rebuild"),
            start_btn = misc.gid("find"),
            i = 0;

        title.innerHTML = "Path Finding<br><sub style='color:yellow'>woops, NO PATH</sub>";
        title.style.background = "darkred";
        rebuild_btn.disabled = 0;
        start_btn.innerHTML = "Cannot find it...";
        start_btn.disabled = 1;

        for (i; i < tiles.length; i++) {
            if (tiles[i].className === "point") {
                tiles[i].className = "point no";
            }
        }

        this.mark_early_path();
    },

    shuffle: function(a) {
        var aa = a.slice(),
            i = 0,
            l = aa.length,
            new_a = [],
            index;

        for (i; i < l; i++) {
            index = Math.floor(Math.random() * aa.length);
            new_a.push(aa[index]);
            aa.splice(index, 1);
        }
        return new_a;
    },

    clear: function() {
        var i = 0,
            k = 0,
            point = this.slc(".point"),
            obj = build.v.object,
            x = g_s.columns,
            y = g_s.rows,
            title = this.gid("title"),
            elm;

        //reset title
        title.innerHTML = "Path Finding<br><sub style='color:#999'>Visualization</sub>";
        title.style.background = "white";

        //loop for reset bunch of things
        for (i; i < x; i++) {
            for (var j = 0; j < y; j++) {
                elm = misc.gid(i + "_" + j);
                //reset DOM coordinate
                elm.innerHTML = i + ", " + j;
                elm.removeAttribute("data-direction");

                //reset object coordinate
                if (obj[i][j] === "path" || obj[i][j] === "wall_path") {
                    obj[i][j] = j;
                }

            }
        }
        //re-add "onclick" trigger
        for (k; k < x * y; k++) {
            if (point[k].className === "point" || point[k].className === "point obs") {
                point[k].setAttribute("onclick", "trigger.mark(this)");
            }
        }
    },

    reconstruct: function() {
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

        var i = 0,
            blockades = AI.v.walls_path,
            obj = build.v.object,
            b, x, y;

        for (i; i < blockades.length; i++) {
            b = blockades[i];
            x = b[0];
            y = b[1];
            obj[x][y] = y;
        }

        blockades = []; //reset current failed directions array

        if (!AI.v.finished) {
            AI.calculate(); //recalculate
        } else {
            AI.v.finished = 0; //restart finished flag      
            this.clear(); //clear path
        }
    },

    slc: function(a) {
        return document.querySelectorAll(a);
    },

    gid: function(a) {
        return document.getElementById(a);
    },

    ga_id: function(a) {
        return a.getAttribute("id");
    },

    s_ti: function(a, b) {
        a.setAttribute("title", b);
    },

    s_cl: function(a, b) {
        a.setAttribute("class", b);
    },

    clock: function() {
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

    filler: function(i, y, d) {
        var j = 0,
            k = 0,
            ar = [],
            arr = [];
        for (j; j < y; j++) {
            ar.push("<div class='point' style='height:" + d +
                "px;width:" + d + "px;line-height:" + d +
                "px' id='" + i + "_" + j +
                "' onclick='trigger.mark(this)'>" + i +
                ", " + j + "</div>");
        }
        for (k; k < y; k++) {
            arr.push(k);
        }
        return [ar.join(""), arr];
    },

    //********************************************
    //Create start and finish points
    //********************************************
    markers: function(a, b, object) {
        var points = misc.slc(".point"),
            //finish coordinate
            en = [a - 1, b - 1],
            //buttons
            btn_1 = misc.gid("find"),
            btn_2 = misc.gid("rebuild");

        btn_1.disabled = btn_2.disabled = 0;
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

    check_DOM: function(x, y, object, interval) {
        if (!!misc.slc(".point").length) {
            this.markers(x, y, object);
            clearInterval(interval);
        }
    },

    //Init builder
    run: function(col, row, size) {
        var i = 0,
            x = col,
            y = row,
            d = size,
            wrapper = misc.gid("outer"),
            array = this.v.array,
            object = this.v.object,
            interval;

        //fill the object and DOM
        for (i; i < x; i++) {
            object[i] = this.filler(i, y, d)[1];
            array.push("<div class='wrap'>" +
                this.filler(i, y, d)[0] +
                "</div>");
        }

        //place elements on DOM
        wrapper.innerHTML = array.join("");
        //set grid wrapper fixed size
        wrapper.style.width = x * d + "px";
        wrapper.style.height = y * d + "px";

        //check DOM
        interval = setInterval(function() {
            build.check_DOM(x, y, object, interval);
        }, 10);
    }
};

//*******************************************************************
//Click handlers
trigger = {
    mark: function(a) {
        var obj = build.v.object,
            c_id = misc.ga_id(a).split("_"),
            x = Number(c_id[0]),
            y = Number(c_id[1]),
            coord_obj = [x, y],
            i = 0,
            walls = AI.v.walls;

        if (a.className === "point obs") {
            obj[x][y] = y;
            a.className = "point";
            for (i; i < walls.length; i++) {
                if (walls[i].toString() === coord_obj.toString()) {
                    walls.splice(i, 1);
                    break;
                }
            }
        } else if (a.className === "point") {
            walls.push([x, y]);
            obj[x][y] = "wall";
            a.className = "point obs";
        }
    },

    reset: function() {
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
        btn_1.disabled = btn_2.disabled = btn_3.disabled = 1;

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
