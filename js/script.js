$(function()
{
    var dimensiones     = {ancho : 320, alto : 480}, //Las dimensiones del escenario...
        ratio           = dimensiones.ancho / dimensiones.alto, //Para mantener el tamaño...
        currentHeight   = window.innerHeight, //El alto actual de la ventana...
        currentWidth    = (currentHeight * ratio) - 50, //El ancho de la ventana en relación a su ratio..
        lcd             = $("#lcd")[0], //Obtener el canvas...
        ctx             = lcd.getContext("2d"), //indicar el contexto...
        w               = lcd.width = (currentWidth * 0.91), //El ancho de la imagen del juego...
        h               = lcd.height = currentHeight * 0.515,//El alto de la imagen del juego...
        worlds          = [],//Los mundos que tendrá el juego...
        currentStage    = [], //El mundo que se está jugando en el momento...
        numWorld        = 0; //El número del mundo seleccionado 2
        numWorldMax     = Number(localStorage.getItem("world")) || 1,
        numMove         = 0,
        dimeFigura      = {w : 0, h : 0},//Las dimensiones de los elementos (cuadrados), dentro del canvas...
        figures         = [], //Guardará la relación de las propiedades de las imagénes...
        positionFigure  = [], //Guarda las posiciones de las figuras en el canvas...
        posLeftCarcasa  = Math.floor((window.innerWidth - currentWidth) / 2),// > 0 ? Math.floor((window.innerWidth - currentWidth) / 2) : 0;
        routeToFollow   = [],
        animation       = {time : 0, animate : false},
        cubePress       = {
                                press   : false,
                                posPres : {x : 0, y : 0},
                                posFigure : [0, 0],
                                numFigure   : 0
                          };
        undoMovement = [];

    //Para el escenario...
    $("#carcasa").width(dimensiones.ancho).height(dimensiones.alto).css(
    {
    	"width" : currentWidth + "px",
    	"height" : currentHeight + "px",
        "left"   : posLeftCarcasa + "px",
    	"background-image": "url(img/base.jpg)",
    	"background-repeat" : "no-repeat",
    	"background-size": "100% 100%"
    });

    $("#lcd").show().css(
    {
        "width": (lcd.width) + "px",
        "height": lcd.height + "px"
    }).
    on("mousedown mouseup mousemove touchstart touchend touchmove", function(e)
    {
        e.stopPropagation(); e.preventDefault();
        var evento = e;
        if(e.type === "touchstart" || e.type === "touchmove" || e.type === "touchend")
        {
            evento = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        }
        var x = (Math.floor(evento.pageX) - this.offsetLeft) - posLeftCarcasa;
        var y = Math.floor(evento.pageY) - this.offsetTop;
        if((x >= 0 && x <= w) && (y >= 0 && y <= h))
        {
            if(!animation.animate)
            {
                if(e.type === "mousedown" || e.type === "touchstart")
                {
                    buscarFigura(x, y);
                }
                else
                {
                    if(e.type === "mouseup" || e.type === "touchend")
                    {
                        cubePress.press = false;
                    }
                    else
                    {
                        if((e.type === "mousemove" || e.type === "touchmove") && cubePress.press)
                        {
                            direccionMove(x, y);
                        }
                    }
                }
            }
        }
        else
        {
            //Revisar si es adecuado dejarlo de esa forma...
            cubePress.press = false;
        }
    });

    //Para buscar al figura que se ha seleccionado en función de su posición...
    var buscarFigura = function(x, y)
    {
        for(var i = 0; i < currentStage.number; i++)
        {
            for(c = 0; c < currentStage.number; c++)
            {
                if((x >= positionFigure[i][c].start.x && x <= positionFigure[i][c].end.x) && (y >= positionFigure[i][c].start.y && y <= positionFigure[i][c].end.y))
                {
                    if(currentStage.world[i][c] !== 0)
                    {
                        if(figures[currentStage.world[i][c] - 1].move)
                        {
                            cubePress.press = true;
                            cubePress.posPres.x = x;
                            cubePress.posPres.y = y;
                            cubePress.posFigure = [i, c];
                            cubePress.numFigure = figures[currentStage.world[i][c] - 1].val;
                        }
                    }
                    break;
                }
            }
        }
    };

    //Para saber la dirección hacia la cual se moverá la figura...
    var direccionMove = function(x, y)
    {
        var directionPos = [
                                {x : -1, y : 0},
                                {x : 0, y : -1},
                                {x : 1, y : 0},
                                {x : 0, y : 1}
                            ];
        var difference = {
                            x : x - cubePress.posPres.x,
                            y : y - cubePress.posPres.y,
                            dirx : 0,
                            diry : 0
                        };
        //Para X...
        if(difference.x > 0)
        {
            if(difference.x >= dimeFigura.w * 0.2)
            {
                difference.dirx = 3;
            }
        }
        else
        {
            if(Math.abs(difference.x) >= dimeFigura.w * 0.2)
            {
                difference.dirx = 1;
            }
        }
        //Para Y...
        if(difference.y > 0)
        {
            if(difference.y >= dimeFigura.h * 0.2)
            {
                difference.diry = 4;
            }
        }
        else
        {
            if(Math.abs(difference.y) >= dimeFigura.h * 0.2)
            {
                difference.diry = 2;
            }
        }
        if(difference.dirx !== 0 || difference.diry !== 0)
        {
            var direction = difference.dirx > difference.diry ? difference.dirx : difference.diry;
            //Buscar si se puede mover hacia la dirección que se ha indicado...
            var posMove = [
                                cubePress.posFigure[0] + directionPos[direction - 1].y,
                                cubePress.posFigure[1] + directionPos[direction - 1].x
                          ];
            if((posMove[0] >= 0 && posMove[0] < currentStage.number) && (posMove[1] >= 0 && posMove[1] < currentStage.number))
            {
                //Se debe buscar si en la posción no hay ningún elemento...
                if(currentStage.world[posMove[0]][posMove[1]] === 0)
                {
                    //Para guardar el valor de deshacer...
                    undoMovement.push({
                                        before : [cubePress.posFigure[0], cubePress.posFigure[1]],
                                        after  : [posMove[0], posMove[1]],
                                        figure : cubePress.numFigure
                                    });
                    currentStage.world[cubePress.posFigure[0]][cubePress.posFigure[1]] = 0;
                    currentStage.world[posMove[0]][posMove[1]] = cubePress.numFigure;
                    cubePress.press = false;
                    //Para saber si ha completado la ruta...
                    numMove++;
                    $("#move").html(numMove <= 9 ? "0" + numMove : numMove);
                    dibujarMundo();
                    fullPath();
                }
            }
        }
    };

    //revisa si se ha terminado la ruta para llegar dle punto A al punto B...
    var fullPath = function()
    {
        var directions = [
                            {
                                dir : "left",
                                x : -1,
                                y : 0
                            },
                            {
                                dir : "top",
                                x : 0,
                                y : -1
                            },
                            {
                                dir : "right",
                                x : 1,
                                y : 0
                            },
                            {
                                dir : "bottom",
                                x : 0,
                                y : 1
                            }];

        //Hallar el inicio del juego...
        var posStart = currentStage.start;
        var start = currentStage.world[posStart[0]][posStart[1]];
        var goal = currentStage.world[currentStage.goal[0]][currentStage.goal[1]];
        //Saber la dirección con la cual debe iniciar...
        var numDire = figures[start - 1].dire;
        //debugger;
        var dirStart = "";
        var posible = [];
        var posMove = [];
        var figurePos = 0;
        var completed = false;
        var isValid = false;
        var typeFigure = "start";
        var path = [];
        do
        {
            path.push({num : start, dire: numDire, pos : posStart, type : typeFigure});
            dirStart = directions[numDire - 1].dir;
            isValid = false;
            posMove = [
                            posStart[0] + directions[numDire - 1].y,
                            posStart[1] + directions[numDire - 1].x
                      ];
            if((posMove[0] >= 0 && posMove[0] < currentStage.number) && (posMove[1] >= 0 && posMove[1] < currentStage.number))
            {
                posStart = posMove;
                //Para saber el número de la figura que se encuentra en esa posición...
                figurePos = currentStage.world[posMove[0]][posMove[1]];
                if(figurePos !== 0)
                {
                    if(figurePos === goal && figures[figurePos - 1].dire === numDire)
                    {
                        completed = true;
                        path.push({num : figurePos, dire: numDire, pos : posStart, type : "goal"});
                        break;
                    }
                    else
                    {
                        posible = figures[start - 1].posible[dirStart];
                        for(var i = 0; i < posible.length; i++)
                        {
                            if(posible[i] === figurePos)
                            {
                                start = posible[i];
                                numDire = figures[posible[i] - 1].arrives[dirStart];
                                typeFigure = "normal";
                                isValid = true;
                                break;
                            }
                        }
                        if(!isValid)
                        {
                            break;
                        }
                    }
                }
                else
                {
                    break;
                }
            }
            else
            {
                break;
            }
        }while(1);
        if(completed)
        {
            createRoute(path);
        }
    };

    var createRoute = function(path)
    {
        var numFigureEs = 0;
        var numCurve = 0;
        var invertir = false;
        for(var i = 0; i < path.length; i++)
        {
            numFigureEs = path[i].num;
            if(numFigureEs >= 2 && numFigureEs <= 5)
            {
                routeToFollow.push({
                                        type : "line",
                                        pos  : [
                                                    {
                                                        x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numFigureEs === 2 ? (dimeFigura.w * 0.45) : numFigureEs === 4 ? (dimeFigura.w * 0.60) : (dimeFigura.w / 2)),
                                                        y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numFigureEs === 2 || numFigureEs === 4 ? (dimeFigura.h / 2) : numFigureEs === 3 ? (dimeFigura.h * 0.45) : (dimeFigura.h * 0.60))
                                                    },
                                                    {
                                                        x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numFigureEs === 2 ? dimeFigura.w : numFigureEs === 3 || numFigureEs === 5 ? (dimeFigura.w / 2) : 0),
                                                        y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numFigureEs === 2 || numFigureEs === 4 ? (dimeFigura.h / 2) : numFigureEs === 3 ? dimeFigura.h : 0)
                                                    }],
                                        alpha : 0,
                                        lineCap : "round"
                                    });
            }
            else
            {
                if(numFigureEs >= 6 && numFigureEs <= 9)
                {
                    routeToFollow.push({
                                            type : "line",
                                            pos  : [
                                                        {
                                                            x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numFigureEs === 7 || numFigureEs === 9 ? (dimeFigura.w / 2) : numFigureEs === 8 ? dimeFigura.w : 0),
                                                            y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numFigureEs === 6 || numFigureEs === 8 ? (dimeFigura.h / 2) : numFigureEs === 7 ? dimeFigura.h : 0)
                                                        },
                                                        {
                                                            x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numFigureEs === 6 ? (dimeFigura.w * 0.60) : numFigureEs === 8 ? (dimeFigura.w * 0.45) : (dimeFigura.w / 2)),
                                                            y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numFigureEs === 6 || numFigureEs === 8 ? (dimeFigura.h / 2) : (dimeFigura.h * 0.40))
                                                        }],
                                            alpha : 0,
                                            lineCap : "round"
                                        });
                }
                else
                {
                    if(numFigureEs >= 10 && numFigureEs <= 17)
                    {
                        numCurve = (numFigureEs - 9) - (numFigureEs >= 14 ? 4 : 0);
                        routeToFollow.push({
                                                type : "curve",
                                                pos  : [
                                                            {
                                                                x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numCurve === 1 || numCurve === 4 ? (dimeFigura.w / 2) : numCurve === 2 ? dimeFigura.w : 0),
                                                                y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numCurve === 1 ? dimeFigura.h : numCurve === 2 || numCurve === 3 ? (dimeFigura.h / 2) : 0)
                                                            },
                                                            {
                                                                x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numCurve === 1 || numCurve === 4 ? (dimeFigura.w / 2) : numCurve === 2 ? dimeFigura.w : 0),
                                                                y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numCurve === 1 ? dimeFigura.h : (dimeFigura.h / 2))
                                                            },
                                                            {
                                                                x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numCurve === 4 ? dimeFigura.w : (dimeFigura.w / 2)),
                                                                y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (dimeFigura.h / 2)
                                                            },
                                                            {
                                                                x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (numCurve === 2 || numCurve === 3 ? (dimeFigura.w / 2) : numCurve === 4 ? dimeFigura.w : 0),
                                                                y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (numCurve === 1 || numCurve === 4 ? (dimeFigura.h / 2) : numCurve === 2 ? dimeFigura.h : 0)
                                                            }],
                                                alpha : 0,
                                                lineCap : "butt"
                                            });
                    }
                    else
                    {
                        if(numFigureEs === 18 || numFigureEs === 20)
                        {
                            routeToFollow.push({
                                                    type : "line",
                                                    pos  : [
                                                                {
                                                                    x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x,
                                                                    y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (dimeFigura.h / 2)
                                                                },
                                                                {
                                                                    x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + dimeFigura.w,
                                                                    y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + (dimeFigura.h / 2)
                                                                }],
                                                    alpha : 0,
                                                    lineCap : "butt"
                                                });
                        }
                        else
                        {
                            if(numFigureEs === 19 || numFigureEs === 21)
                            {
                                //Arriba a abajo...
                                routeToFollow.push({
                                                        type : "line",
                                                        pos  : [
                                                                    {
                                                                        x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (dimeFigura.w / 2),
                                                                        y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y
                                                                    },
                                                                    {
                                                                        x : positionFigure[path[i].pos[0]][path[i].pos[1]].start.x + (dimeFigura.w / 2),
                                                                        y : positionFigure[path[i].pos[0]][path[i].pos[1]].start.y + dimeFigura.h
                                                                    }],
                                                        alpha : 0,
                                                        lineCap : "butt"
                                                    });
                            }
                        }
                    }
                }
            }
        }
        if(numWorld + 1 >= numWorldMax)
        {
            numWorldMax++;
            $("#level_" + numWorldMax).removeClass("noTerminado").addClass("terminado");
            localStorage.setItem("world", numWorldMax);
        }
        animation.animate = true;
        animate();
    };

    //Cargar el Json que contiene los datos de las imágenes...
    $.getJSON("js/figures.json", function(data)
	{
		figures = data;
        loadImages(figures, function()
        {
            //Para cargar los escenarios...
            $.getJSON("js/worlds.json?a=3", function(data)
            {
                worlds = data;
                //Temporal para cargar un juego, la idea es mostrar el listado de mundos
                //Y validar que sólo pueda pasar al siguiente si ya pasó todos, en este caso con localStorage.
                //No usaré servicio alguno en el momento...
                //cargarMundo();
                //Cargar los mundos a seleccionar y validar el mundo...
                var txt = "";
                for(var veces = 1; veces <= 2; veces++)
                {
                    for(var i = 1; i <= worlds.length; i++)
                    {
                        if(veces === 1)
                        {
                            txt += "<div id = 'level_"+(i)+"' class = 'selLevel "+(i <= numWorldMax ? "terminado" : "noTerminado")+"'>" +
                                        "Level " + (i <= 9 ? "0" + i : i) +
                                   "</div>";
                        }
                        else
                        {
                            $("#level_" + i).click(function(event) {
                                var ind = Number(this.id.split("_")[1]);
                                if(ind <= numWorldMax)
                                {
                                    $("#fade").hide();
                                    $("#levels").hide();
                                    numWorld = ind - 1;
                                    cargarMundo();
                                }
                            });
                        }

                    }
                    if(veces === 1)
                    {
                        $("#listlevels").html(txt);
                    }
                }
                $("#loading").hide("fast");
                $("#levels").show();
            });
        });
	});

    //Para hacer una precarga de las imágenes...
    function loadImages(paths, whenLoaded)
    {
        var count = 0;
        paths.forEach(function(path, i)
        {
            var img = new Image;
            img.onload = function()
            {
                figures[Number(img.id)].src = img;
                count++;
                if (count === paths.length) whenLoaded();
            }
            img.src = "img/" + path.img;
            img.id = i;
        });
    }

    //Para cargar el mundo que se juagará...
    var cargarMundo = function()
    {
        currentStage = JSON.parse(JSON.stringify(worlds[numWorld]));
        $("#level").html((numWorld + 1) <= 9 ? "0" + (numWorld + 1) : (numWorld + 1));
        numMove = 0;
        $("#move").html("00");
        dimeFigura = {w : w / currentStage.number, h : h / currentStage.number},//Las dimensiones de los elementos (cuadrados), dentro del canvas...
        routeToFollow = []; //Se reinicia la variable que contiene la ruta a seguir...
        undoMovement = []; //Para reiniciar el array de movmientos...
        //Para las variables de animación...
        animation.animate = false;
        //Para cargar el mundo actual...
        //Reiniciar la posicón de la figura...
        positionFigure = [];
        //Para obtener las posciones en las que estará cada objeto en el escenario...
        for(var i = 0; i < currentStage.number; i++)
        {
            positionFigure.push([]);
            for(c = 0; c < currentStage.number; c++)
            {
                positionFigure[i].push({
                                            "start" : {
                                                            x : dimeFigura.w * c,
                                                            y : dimeFigura.h * i
                                                      },
                                            "end"   :
                                                      {
                                                            x : (dimeFigura.w * c) + dimeFigura.w,
                                                            y : (dimeFigura.h * i) + dimeFigura.h
                                                      }
                                       });
            }
        }
        dibujarMundo();
    };

    var dibujarMundo = function()
    {
        //Para pintar el mundo de forma temporal...
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.clearRect(0, 0, w, h);
        for(var i = 0; i < currentStage.number; i++)
        {
            for(c = 0; c < currentStage.number; c++)
            {
                if(currentStage.world[i][c] !== 0)
                {
                    ctx.drawImage(figures[currentStage.world[i][c] - 1].src, positionFigure[i][c].start.x, positionFigure[i][c].start.y, dimeFigura.w, dimeFigura.h);
                }
            }
        }
    };

    //Animar el movimiento...
    function animate()
    {
        dibujarMundo();
        var totalMuestra = 0;
        for(var i = 0 ; i < routeToFollow.length; i++)
        {
            if(routeToFollow[i].alpha >= 0.7)
            {
                alphaRoute(routeToFollow[i]);
                totalMuestra++;
            }
            else
            {
                routeToFollow[i].alpha += 0.2;
                alphaRoute(routeToFollow[i]);
                break;
            }
        }
        if (totalMuestra  === routeToFollow.length)
        {
            //console.log("Ingresa");
            cancelRequestAnimFrame(animation.time);
            swal(
			{
				title: "Excellent",
				text: "You have exceeded the level",
				showCancelButton: false,
				confirmButtonColor: "#DD6B55",
				confirmButtonText: "Ok",
				closeOnConfirm: false,
				imageUrl	: "img/coin.gif"
			},
			function()
			{
				swal({title: "Reload",   text: "Reload",   timer: 500,   showConfirmButton: false });
                numWorld++;
                if(numWorld < worlds.length)
                {
                    cargarMundo();
                }
                else
                {
                    location.reload();
                }
			});
        }
        else
        {
            animation.time = requestAnimationFrame(animate);
        }
    }

    var alphaRoute = function(element)
    {
        ctx.beginPath();
        ctx.lineWidth = dimeFigura.w * 0.35;
        if(element.type === "line")
        {
            ctx.moveTo(
                        element.pos[0].x,
                        element.pos[0].y
                      );
            ctx.lineTo(
                        element.pos[1].x,
                        element.pos[1].y
                    );
        }
        else
        {
            ctx.moveTo(element.pos[0].x, element.pos[0].y);
            //Para realizar la curva...
            ctx.bezierCurveTo(element.pos[1].x, element.pos[1].y,
                              element.pos[2].x, element.pos[2].y,
                              element.pos[3].x, element.pos[3].y);
        }
        ctx.strokeStyle = "rgba(45, 135, 197, "+element.alpha+")";
        ctx.lineCap = element.lineCap;
        ctx.stroke();
    };
    /*
    $(document).on('touchstart', function(event) {
        if(!animation.animate)
        {
            event.preventDefault();
        }
    });
    */

    $(document).bind("contextmenu", function(e) {
        e.preventDefault();
    });


    $("#btnundo").click(function(event)
    {
        if(undoMovement.length > 0 && !animation.animate)
        {
            var undo = undoMovement[undoMovement.length - 1];
            currentStage.world[undo.after[0]][undo.after[1]] = 0;
            currentStage.world[undo.before[0]][undo.before[1]] = undo.figure;
            numMove--;
            $("#move").html(numMove <= 9 ? "0" + numMove : numMove);
            dibujarMundo();
            undoMovement.pop();
        }
    });

    $("#btnlevel").click(function(event) {
        $("#fade").show();
        $("#levels").show();
    });

    //Para la acción del requestAnimFrame...
    //http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
    window.cancelRequestAnimFrame = ( function() {
        return window.cancelAnimationFrame          ||
            window.webkitCancelRequestAnimationFrame    ||
            window.mozCancelRequestAnimationFrame       ||
            window.oCancelRequestAnimationFrame     ||
            window.msCancelRequestAnimationFrame        ||
            clearTimeout
    } )();

    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback, /* DOMElement */ element){
                return window.setTimeout(callback, 1000 / 60);
            };
    })();
    //Fin de invocar el requestAnimationFrame...
});
