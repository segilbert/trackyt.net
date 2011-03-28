﻿function tasksControl(div, layout, updateTaskPositionCallback, updateTaskDescriptionCallback) {
    this.div = div;
//    this.layout = layout;
//    this.updateTaskPositionCallback = updateTaskPositionCallback;
//    this.updateTaskDescriptionCallback = updateTaskDescriptionCallback;
    this.tasks = [];

    this.init();
}


tasksControl.prototype = (function () {

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // helpers
    var TaskStatusNone = 0; var TaskStatusStarted = 1; var TaskStatusStopped = 2;

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // helpers

    function removeFromArray(tasks, task) {
        var me = this;
        this.task = task;

        return $.grep(tasks, function (t) {
            return t.id != me.task.id;
        });
    }

    function getTaskById(tasks, id) {
        for (var t in tasks) {
            if (tasks[t].id == id) {
                return tasks[t];
            }
        }
        return null;
    }

    function idToTaskReference(id) {
        return 'task-' + id;
    }

    function taskReferenceToId(ref) {
        return ref.substr(5);
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // private members

    // class task definition
    function task(control, t) {
        var me = this;

        this.id = t.id;
        this.ref = idToTaskReference(this.id);
        this.control = control;
        this.control.div.append('<div id=' + this.ref + ' class="task"></div>');
        this.div = $('#' + this.ref);

        this.sections = [];

        this.sections['moveontop'] = new moveOnTop(this, t);
        this.sections['description'] = new description(this, t);

        // tmp removed section
        //this.sections['remove'] = new remove(this, t);
        this.sections['done'] = new done(this, t);
        // end section

        this.sections['stop'] = new stop(this, t);
        this.sections['start'] = new start(this, t);
        this.sections['plantodate'] = new plantodate(this, t);
        this.sections['timer'] = new timer(this, t);
        this.sections['planned'] = new planned(this, t);

        // subscribe on timer event
        this.timerStarted = function () {
            me.started = true;
            me.sections['start'].disable();
            me.sections['stop'].enable();
        }

        this.timerStopped = function () {
            me.started = false;
            me.sections['start'].enable();
            me.sections['stop'].disable();
        }

        // initialize timer
        this.sections['timer'].onTimerStarted(this.timerStarted);
        this.sections['timer'].onTimerStopped(this.timerStopped);
        this.sections['timer'].init();

        //        // call external layout handler to apply custom styles
        //        if (this.control.layout) {
        //            this.control.layout(this.div);
        //        }

        // show it
        this.div.slideDown();
    }

    // class task members
    task.prototype = (function () {
        return {
            remove: function () {
                var me = this;
                this.div.slideUp(function () { me.div.remove(); });
            },

            start: function () {
                this.sections['timer'].run();
            },

            stop: function () {
                this.sections['timer'].pause();
            },

            setDescription: function (desc) {
                this.sections['description'].setDescription(desc);
            },

            setPlannedDate: function (date) {
                this.sections['planned'].setPlannedDate(date);
            }

        }

    })();

    // class moveOnTop definition
    function moveOnTop(task, t) {
        task.div.append('<span class="moveontop"></span>');
    }

    // class description definition
    function description(task, t) {
        this.description = t.description;
        this.ref = 'description-' + t.id;

        task.div.append('<span id="' + this.ref + '" class="description">' + this.description + '</span>');
    }

    description.prototype = (function () {

        return {

            setDescription: function (d) {
                $('#' + this.ref).html(d);
            }
        };

    })();

    function plantodate(task, t) {
        task.div.append('<span class="plantodate"></div>');
    }

    // class timer definition
    function timer(task, t) {
        this.status = t.status;
        this.spent = t.spent;
        this.ref = 'timer-' + t.id;

        // event handlers
        this.onTimerStartedHandler = null;
        this.onTimerStoppedHandler = null;

        this.format = function () {
            var hours = Math.floor(this.spent / 3600);
            var minutes = Math.floor(this.spent / 60) % 60;
            var seconds = this.spent % 60;

            var formatted = '' + hours + ':';
            if (minutes < 10)
                formatted += '0';
            formatted += minutes + ':';
            if (seconds < 10)
                formatted += '0';
            formatted += seconds;
            return formatted;
        }

        this.update = function () {
            $('#' + this.ref).html(this.format());
        }

        task.div.append('<span id="' + this.ref + '" class="timer">' + this.format() + '</span>');
    }

    // class timer members
    timer.prototype = (function () {
        return {
            run: function () {
                var me = this;

                if (!this.timerId) {
                    this.timerId = setInterval(function () { me.spent++; me.update(); }, 1000);
                }

                if (this.onTimerStartedHandler) {
                    this.onTimerStartedHandler();
                }

                $('#' + this.ref).addClass('run');
            },

            pause: function () {
                clearTimeout(this.timerId); this.timerId = null;

                if (this.onTimerStoppedHandler) {
                    this.onTimerStoppedHandler();
                }

                $('#' + this.ref).removeClass('run');
            },

            init: function () {
                if (this.status == TaskStatusStarted) {
                    this.run();
                } else {
                    this.pause();
                }
            },

            onTimerStarted: function (h) {
                this.onTimerStartedHandler = h;
            },

            onTimerStopped: function (h) {
                this.onTimerStoppedHandler = h;
            }
        }

    })();

    var enableDisable = (function () {
        return {
            enable: function () {
                $('#' + this.ref).show();
            },

            disable: function () {
                $('#' + this.ref).hide();
            }
        }
    })();

    function start(task, t) {
        this.ref = 'start-' + t.id;
        task.div.append('<span id="' + this.ref + '" class="start"><a href="/tasks/start/' + task.id + '" title="Start">Start</a></span>');
    }

    start.prototype = enableDisable;

    function stop(task, t) {
        this.ref = 'stop-' + t.id;
        task.div.append('<span id="' + this.ref + '" class="stop"><a href="/tasks/stop/' + task.id + '" title="Stop">Stop</a></span>');
    }

    stop.prototype = enableDisable;

    function remove(task, t) {
        task.div.append('<span class="delete"><a href="/tasks/delete/' + task.id + '" title="Delete">Delete</a></span>');
    }

    function done(task, t) {
        task.div.append('<span class="done"><a href="/tasks/done/' + task.id + '" title="Done">Done</a></span>');        
    }

    function planned(task, t) {
        this.ref = 'planned-' + t.id;
        this.plannedDate = t.plannedDate;

        this.format = function () {
            if (this.plannedDate) {
                var date = new Date(parseInt(this.plannedDate.substr(6)));
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();

                if (day < 10) { day = '0' + day }
                if (month < 10) { month = '0' + month }

                return day + '-' + month + '-' + year;
            }

            return '';
        }

        task.div.append('<span id="' + this.ref + '" class="planned">' + this.format() + '</span>');
    }

    planned.prototype = (function () {

        return {

            setPlannedDate: function (date) {
                $('#' + this.ref).html(date);
            }

        };

    })();


    return {

        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // public members

        init: function () {
            //makeSortable(this.div);
        },

        addTask: function (t) {
            var taskToAdd = new task(this, t);
            this.tasks.push(taskToAdd);
        },

        removeTask: function (id) {
            var taskToRemove = getTaskById(this.tasks, id);
            if (taskToRemove) {
                this.tasks = removeFromArray(this.tasks, taskToRemove);
                taskToRemove.remove();
            }
        },

        startTask: function (id) {
            var taskToStart = getTaskById(this.tasks, id);
            if (taskToStart) {
                taskToStart.start();
            }
        },

        stopTask: function (id) {
            var taskToStop = getTaskById(this.tasks, id);
            if (taskToStop) {
                taskToStop.stop();
            }
        },

        startAll: function () {
            for (var t in this.tasks) {
                this.tasks[t].start();
            }
        },

        stopAll: function () {
            for (var t in this.tasks) {
                this.tasks[t].stop();
            }
        },

        // used by unit tests
        startedCount: function () {
            var count = 0;
            for (var t in this.tasks) {
                if (this.tasks[t].started) {
                    count++;
                }
            }
            return count;
        },

        // used by unit tests
        stoppedCount: function () {
            var count = 0;
            for (var t in this.tasks) {
                if (!this.tasks[t].started) {
                    count++;
                }
            }
            return count;
        },

        // used by unit tests
        tasksCount: function () {
            return this.tasks.length;
        },

        getTaskIdFromReference: function (ref) {
            return taskReferenceToId(ref);
        },

        setTaskDescription: function (taskRef, desc) {
            var id = taskReferenceToId(taskRef);
            var task = getTaskById(this.tasks, id);
            task.setDescription(desc);
        },

        setTaskPlannedDate: function (taskRef, date) {
            var id = taskReferenceToId(taskRef);
            var task = getTaskById(this.tasks, id);
            task.setPlannedDate(date);
        }
    };
})();