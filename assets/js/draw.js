fabric.Object.prototype.toObject = (function (toObject) {
    return function () {
        return fabric.util.object.extend(toObject.call(this),
                {
                    id: this.id,
                });
    };
})(fabric.Object.prototype.toObject);

var canvas, background_img;
$(function () {
	
    //Init canvas
    canvas = new fabric.Canvas('c');
	
	background_img = new Image();
	background_img.crossOrigin = "Anonymous";
	background_img.src = "http://fabricjs.com/assets/jail_cell_bars.png";
    background_img.onload = function() {
       var f_img = new fabric.Image(background_img);
       canvas.setBackgroundImage(f_img);
	   canvas.setWidth(background_img.width);
	   canvas.setHeight(background_img.height);
       canvas.renderAll();
    };
  
    //Init scroll
	scrollImage($("#btn_scroll"));
	
    //Draw shape
    var rect, circle, isDown, origX, origY;
    var count = 0;
    canvas.on('mouse:down', function (o) {
	
        count = 0;
        if (typeof o.target != "undefined" || !isDraw || shape_selected =="" || draw_color =="")
            return;

		validateData();
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        var pointer = canvas.getPointer(o.e);
		
        if (shape_selected == "rectangle") {
            rect = new fabric.Rect({
                left: origX,
                top: origY,
                stroke: draw_color,
                strokeWidth: 2,
                fill: 'transparent',
                opacity: 1,
                width: pointer.x - origX,
                height: pointer.y - origY
            });
            rect.myCustomOptionKeepStrokeWidth = 2;
            canvas.add(rect);
        } else if (shape_selected == "circle") {

            ellipse = new fabric.Ellipse({
                left: origX,
                top: origY,
                originX: 'left',
                originY: 'top',
                rx: pointer.x - origX,
                ry: pointer.y - origY,
                angle: 0,
                fill: '',
                stroke: draw_color,
                strokeWidth: 2,
            });
            ellipse.myCustomOptionKeepStrokeWidth = 2;
            canvas.add(ellipse);
            save();
        }
     
    });

    canvas.on('mouse:move', function (o) {
        
        if (!isDown)
            return;
		
        var pointer = canvas.getPointer(o.e);
        if (shape_selected == "rectangle") {
            
            if (origX > pointer.x) {
                rect.set({ left: Math.abs(pointer.x) });
            }
            if (origY > pointer.y) {
                rect.set({ top: Math.abs(pointer.y) });
            }

            rect.set({ width: Math.abs(origX - pointer.x) });
            rect.set({ height: Math.abs(origY - pointer.y) });
            rect.setCoords();
            canvas.renderAll();

            if (count == 0 && rect.width > 0) {
                save();
            }
           

        } else if (shape_selected == "circle") {

            var rx = Math.abs(origX - pointer.x) / 2;
            var ry = Math.abs(origY - pointer.y) / 2;
            if (rx > ellipse.strokeWidth) {
                rx -= ellipse.strokeWidth / 2
            }
            if (ry > ellipse.strokeWidth) {
                ry -= ellipse.strokeWidth / 2
            }
            ellipse.set({ rx: rx, ry: ry });

            if (origX > pointer.x) {
                ellipse.set({ originX: 'right' });
            } else {
                ellipse.set({ originX: 'left' });
            }
            if (origY > pointer.y) {
                ellipse.set({ originY: 'bottom' });
            } else {
                ellipse.set({ originY: 'top' });
            }
            ellipse.setCoords();
            canvas.renderAll();
        }
       
        count++;
    });

    canvas.on('mouse:up', function (o) {
        isDown = false;

        if (shape_selected == "line") {

            var line_item = canvas.item(canvas.getObjects().length - 1);
            if (line_item != null && typeof line_item != 'undefined') {
                canvas.setActiveObject(line_item);
                selectAndMoveShape($("#select-mode"));
                save();
            }
        }
    });


    //Init
    canvas.isDrawingMode = false;
    canvas.freeDrawingBrush.width = 5;
    setColor(draw_color);

    var sendToApp = function (_key, _val) {
        var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", _key + ":##drawings##" + _val);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    };

    canvas.on({
        'object:scaling': function (e) {
            var obj = e.target;
            if (obj.myCustomOptionKeepStrokeWidth) {
                var newStrokeWidth = obj.myCustomOptionKeepStrokeWidth / ((obj.scaleX + obj.scaleY) / 2);
                obj.set('strokeWidth', newStrokeWidth);
            }
        }
    });

    var isSelect = false;
    canvas.on('object:selected', function (options) {
        if (options.target) {
            isSelect = true;
            sendToApp("object:selected", "");
        }
    });

    canvas.on('selection:cleared', function (options) {
        isSelect = true;
        sendToApp("selection:cleared", "");
    });

    canvas.on('object:modified', function (options) {
        //save();
        if (options.target) {
            sendToApp("object:modified", "");
        }
    });

    canvas.on('object:added', function (options) {
        if (options.target) {
            if (typeof options.target.id == 'undefined') {
                options.target.id = 1337;
            }
            sendToApp("object:added", "");
        }
    });

    canvas.on('object:removed', function (options) {
        if (options.target) {
            isSelect = false;
            sendToApp("object:removed", "");
        }
    });
	
    window.addEventListener('resize', resizeCanvas, false);
    save();
    
    //Set event undo and redo
    $('#undo').click(function () {
        replay(undo, redo, '#redo', this);
    });
    $('#redo').click(function () {
        replay(redo, undo, '#undo', this);
    });
	
	 fabric.util.addListener(fabric.window, 'load', function() {
    var canvas = this.__canvas || this.canvas,
        canvases = this.__canvases || this.canvases;

    canvas && canvas.calcOffset && canvas.calcOffset();

    if (canvases && canvases.length) {
      for (var i = 0, len = canvases.length; i < len; i++) {
        canvases[i].calcOffset();
      }
    }
  });
});



function color() {
    return canvas.freeDrawingBrush.color;
}

function setColor(color) {
    canvas.freeDrawingBrush.color = color;
}

var draw_color = "red";
function setColorTools(tag, color) {
    $("a.color-tools").removeClass("color-active");
    draw_color = color;
    $(tag).addClass("color-active");

    //Change color if have object selected
    var group_active = canvas.getActiveGroup();
    var item_active = canvas.getActiveObject();
    if (group_active != null) {

        var items = group_active._objects;
        if (items != null) {
            for (var i = 0; i < items.length; i++) {
                canvas.getActiveGroup()._objects[i].set("stroke", color);
                canvas.renderAll();
            }
        }
    } else if (item_active != null) {
        canvas.getActiveObject().set("stroke", color);
        canvas.renderAll();
    }
}

function validateData(){
	var arr_idx = [];
	var objects = canvas.getObjects();
	if(objects != null && objects.length >0){
		for(var i=0;i<objects.length;i++){
			if(objects[i].width ==0 || objects[i].height ==0){
				arr_idx.push(objects[i]);
			}
		}
	}
	
	if(arr_idx != null && arr_idx.length >0){
		for(var i=0;i<arr_idx.length;i++)
			canvas.remove(arr_idx[i]);
	}
}
//Set init scroll image-editor
function scrollImage(tag){
	$("a.shape-type").removeClass("color-active");
    $(tag).addClass("color-active");
	isDraw = false;
	canvas.controlsAboveOverlay = true;
    canvas.centeredScaling = true;
    canvas.allowTouchScrolling = true;
	canvas.selection = false;
}

//Select and move shape
var isDraw = true;
function selectAndMoveShape(tag) {
    $("a.shape-type").removeClass("color-active");
    $(tag).addClass("color-active");
    isDraw = false;
    canvas.isDrawingMode = false;
	canvas.allowTouchScrolling = false;
	canvas.selection = true;
}

//Draw shape
var shape_selected = "";
function selectShape(tag, _shape_selected) {

    isDraw = true;
	canvas.allowTouchScrolling = false;
	canvas.selection = true;
    $("a.shape-type").removeClass("color-active");
    $(tag).addClass("color-active");
    shape_selected = _shape_selected;

    if (shape_selected == "line") {
        canvas.isDrawingMode = !canvas.isDrawingMode;
        canvas.freeDrawingBrush.width = 2;
        save();
    }
    else {
        canvas.isDrawingMode = false;
    }
}

function resizeCanvas() {
	
	if(typeof background_img != 'undefined'){	
		canvas.setWidth(background_img.width);
		canvas.setHeight(background_img.height);
		canvas.renderAll();	
	}
}

function addText(tag) {

    $("a.shape-type").removeClass("color-active");
    $(tag).addClass("color-active");
    isDraw = false;
    canvas.isDrawingMode = false;
    shape_selected = "";

    //Draw text
    var $itext = $('<textarea/>').addClass('itext');
    var text = 'enter text here';
    var itext = new fabric.IText(text, {
        left: 50,
        top: 50,
        fontSize: 16,
        fill: draw_color
    }).on('editing:entered', function (e) {
        var obj = this;
        canvas.remove(obj);
        // show input area
        $itext.css({
            left: obj.left,
            top: obj.top,
            'line-height': obj.lineHeight,
            'font-family': obj.fontFamily,
            'font-size': Math.floor(obj.fontSize * Math.min(obj.scaleX, obj.scaleY)) + 'px',
            'font-weight': obj.fontWeight,
            'font-style': obj.fontStyle,
            color: obj.fill
        })
        .val(obj.text)
        .appendTo($(canvas.wrapperEl).closest('.image-editor'));

        // submit text by focusout
        $itext.on('focusout', function (e) {
            obj.exitEditing();
            obj.set('text', $(this).val());
            $(this).remove();
            canvas.add(obj);
            canvas.renderAll();
        });

        //focus on text
        setTimeout(function () {
            $itext.select();
        }, 1);
    });
    canvas.add(itext);
    canvas.setActiveObject(itext);
    save();
}

//Remove shape selected
function removeSelected() {
    $("a.shape-type").removeClass("color-active");
    shape_selected = "";
    isDraw = false;
    canvas.isDrawingMode = false;
	
    var grp = canvas.getActiveGroup();
    var obj = canvas.getActiveObject();
    if (obj != null) {
        canvas.remove(obj);
    }
    if (grp != null) {
        grp.forEachObject(function (o) { canvas.remove(o) });
        canvas.discardActiveGroup().renderAll();
    }
	
	var objects = canvas.getObjects();
	if(objects != null){
		canvas.clear();
	}
	
    isSelect = false;
    if (canvas.getObjects().length == 0) {
        $('#redo').addClass("disable-button");
        $('#undo').addClass("disable-button");
    }
}

//Undo and Redo
var state;
var undo = [];
var redo = [];
function save() {
    redo = [];
    $('#redo').addClass("disable-button");
    $('#undo').addClass("disable-button");
    if (state) {
        undo.push(state);
        $('#undo').removeClass("disable-button");
    }
    state = JSON.stringify(canvas);

    console.log("push");
}

function replay(playStack, saveStack, buttonsOn, buttonsOff) {
    saveStack.push(state);
    state = playStack.pop();
    var on = $(buttonsOn);
    var off = $(buttonsOff);
    // turn both buttons off for the moment to prevent rapid clicking
    on.addClass("disable-button");
    off.addClass("disable-button");
    canvas.clear();
    canvas.loadFromJSON(state, function () {
        canvas.renderAll();
        // now turn the buttons back on if applicable
        on.removeClass("disable-button");
        if (playStack.length) {
            off.removeClass("disable-button");
        }
    });
}
 //Save image
    function downloadCanvas(link, canvasId, filename) {
        link.href = document.getElementById(canvasId).toDataURL();
        link.download = filename;
    }


