
var app = {};
// DPI
(function (app) {
    'use strict';

    function isNotString(obj) {
        return typeof obj !== 'string';
    }

    function DPI(debug) {
        this.modules = [];
        this.DEBUG = debug || false;
    }

    DPI.prototype.getModuleIndex = function (moduleName) {
        var index = -1;
        this.modules.some(function (m, i) {
            if (m.name === moduleName) {
                index = i;
                return true;
            }
            return false;
        });
        return index;
    };
    DPI.prototype.module = function (moduleName, arr) {
        if (isNotString(moduleName)) {
            throw 'The first argument: "moduleName" must be a [String]!';
        } else {
            moduleName = moduleName.trim();
        }

        if (typeof arr === 'function') {
            this.modules.push(new Module(moduleName, [], arr, this));
        } else if (Array.isArray(arr)) {
            this.modules.push(new Module(moduleName, arr, arr.pop(), this));
        } else {
            throw('The second argument of DPI.module must be an [Array] or a [Function]!');
        }
    };
    DPI.prototype.getModuleArgs = function (module) {
        var that = this,
            result = false,
            args = [];

        module.deps.forEach(function (moduleName) {
            var moduleIndex = that.getModuleIndex(moduleName);
            if (moduleIndex >= 0) {
                if (that.modules[moduleIndex].hasOwnProperty('val')) {
                    args.push(that.modules[moduleIndex].val);
                }
            } else {
                throw 'No such module ' + moduleName + '!';
            }
        });

        if (args.length === module.deps.length) {
            result = args;
        }

        return result;
    };
    DPI.prototype.apply = function () {
        var that = this;
        this.modules.forEach(function (module) {
            if (!module.runned) {
                var args = that.getModuleArgs(module);
                if (args) {
                    module.runned = true;
                    module.run.apply(module, args);
                }
            }
        });
    };
    DPI.prototype.loadScript = function (src, async, callback) {
        var script = document.createElement('script');
        script.src = ('https:' == document.location.protocol ? 'https' : 'http') + ':' + src;
        script.type = 'text/javascript';
        script.async = async || true;
        script.onload = callback;

        var head = document.getElementsByTagName('head')[0];
        head.appendChild(script);
    };

    function Module(name, deps, run, dpi) {
        if (deps.some(isNotString)) {
            throw ('The dependencies of module ' + name + ' must be a [String]!');
        }
        this.name = name;
        this.run = run;
        this.deps = deps;
        this.runned = false;
        this.dpi = dpi;
    }

    Module.prototype.emit = function (obj) {
        if (this.dpi.DEBUG === true) {
            console.log('#DPI> Modue "' + this.name + '" ready.');
        }
        this.val = obj;
        this.dpi.apply();
    };

    app.DPI = DPI;
}(app));

app.dpi = new app.DPI();
app.dpi.module('feed', [function () {
/*
    var feed = {
        looping: 2,
        target: "_blank",
        bbttext: "Tap to bet",
        text21: "bet &pound;10&nbsp;",
        text22: "get &pound;30 free"
    };

    this.emit(fixData(feed));
*/

	/* task 2*/
/*
    var feed = {
        looping: 2,
        target: "_blank",
        bbttext: "Tap to bet",
        text21: "bet &pound;10&nbsp;",
        text22: "get &pound;30 free"
    }; 
*/
	var feed = {};
	
	function ajax(url) {
	  return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
		  resolve(this.responseText);
		};
		xhr.onerror = reject;
		xhr.open('GET', url);
		xhr.send();
	  });
	}

	var that = this;

	ajax("jsonfeed_test.json").then(function(result) {
	  // Code depending on result
	  console.log('success');	  
	  console.log(result); 
	  feed = JSON.parse(result);	  
	  console.log(feed);	  
	  that.emit(fixData(feed));		
	}).catch(function() {
	  // An error occurred
	  console.log('error');
	});	

//    this.emit(fixData(feed));
	/* task 2 */

    function fixData(data) {
        data.queryParams = getQueryParams(document.location.search);
        return data;
    }

    function getQueryParams(qs) {
        qs = qs.split("+").join(" ");

        var params = {}, tokens,
            re = /[?&]?([^=]+)=([^&]*)/g;

        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])]
                = decodeURIComponent(tokens[2]);
        }

        return params;
    }

}]);
app.dpi.module('documentLoad', [function () {
    var that = this,
        docReadyId = setInterval(function () {
            if ((document.readyState === "interactive" || document.readyState === "complete")) {
                clearInterval(docReadyId);
                that.emit('documentLoad');
            }
        }, 50);
}]);
app.dpi.module('fonts', [function () {
    var that = this,
        css = {
            en: 'bf_fonts.css'
        };

    window.WebFontConfig = {
        custom: {
            families: ['block_regular', 'informa_bold'],
            urls: ['css/bf_fonts.css']
        },
        active: function () {
            that.emit('fonts ready');
        }
    };

    app.dpi.loadScript('//ajax.googleapis.com/ajax/libs/webfont/1.5.6/webfont.js', true);
}]);
app.dpi.module('bbt', ['feed', 'documentLoad',
    function (feed) {
        document.querySelector('.bbt > div > div').innerHTML = feed.bbttext;
    }
]);
app.dpi.module('text', ['feed', 'documentLoad',
    function (feed) {
        var texts = document.querySelectorAll('.text2 > span');

        texts[0].innerHTML = feed.text21;
        texts[1].innerHTML = feed.text22;
    }
]);
app.dpi.module('clickTag', ['feed',
    function (feed) {
        var clickTag = fixClickTag(feed.queryParams.clickTag);

        if (clickTag) {
            document.getElementById('banner').addEventListener('click', function () {
                window.open(clickTag, feed.target);
            });
        }

        function fixClickTag(clickTag) {
            return (!clickTag || clickTag.indexOf('mpvc') >= 0 || clickTag.indexOf('//') < 0) ? null : clickTag;
        }

        this.emit();
    }
]);
app.dpi.module('animation', ['feed', 'documentLoad', 'fonts',
    function (feed) {
        var banner = document.getElementById('banner'),
            ball = document.getElementsByClassName('ball')[0],
            icon = document.getElementsByClassName('betfair-icon')[0],
            text1 = document.querySelectorAll('.text1 span'),
            text1p = document.querySelector('.text1 p'),
            text2 = document.querySelectorAll('.text2 span'),
            text2p = document.querySelector('.text2 p'),
            terms = document.getElementsByClassName('terms')[0];


        var tween1 = new TimelineLite({paused: true, onComplete: onAnimationComplete});

        tween1.to(ball, 0.6, {right: 251, ease: Sine.easeIn})
            .to(ball, 0.6, {top: 151, ease: Circ.easeIn}, '-=0.8')
            .to(ball, 0.2, {top: 69, rotation: -100, ease: Sine.easeOut}, '-=0.2')
            .to(ball, 0.2, {top: 151, ease: Sine.easeIn})
            .to(ball, 1, {right: -80, rotation: 360}, '-=0.2')
            .to(icon, 0.2, {opacity: 1}, '-=1.2')
            .to(ball, 0.2, {top: 100}, '-=0.8')
            .to(ball, 0.2, {top: 151, ease: Sine.easeIn}, '-=0.6')

            .to(ball, 0.2, {top: 530, right: 165, rotation: -200, ease: Sine.easeOut})

            .to(text1[0], 0.3, {opacity: 1, transform: 'scale(1)', ease: Back.easeOut}, '+=0.25')
            .to(text1[1], 0.3, {opacity: 1, transform: 'scale(1)', ease: Back.easeOut})
            .to(text1[2], 0.3, {opacity: 1, transform: 'scale(1)', ease: Back.easeOut})
            .to(text1p, 0.2, {opacity: 1}, '+=0.5')

            .to([text1[0], text1[1], text1[2], text1p], 0.2, {opacity: 0}, '+=2')

            .to(text2[0], 0.2, {opacity: 1}, '+=0.5')
            .to([text2[1]], 0.2, {opacity: 1}, '+=0.5')
            .to(text2p, 0.2, {opacity: 1}, '+=0.5')
            .to(terms, 0.2, {opacity: 1}, '-=0.2');

        tween1.timeScale(0.3);


        TweenLite.to(banner, 0.5, {
            opacity: 1,
            onComplete: function () {
                tween1.play();
            }
        });

        function onAnimationComplete() {
            if (feed.looping > 0) {
                feed.looping -= 1;
            }

            if (feed.looping !== 0) {
                setTimeout(function () {
                    tween1.pause().progress(0);
                }, 2000);

                setTimeout(function () {
                    tween1.restart();
                }, 4000);
            }
        }


        this.emit();
    }

]);
app.dpi.apply();
