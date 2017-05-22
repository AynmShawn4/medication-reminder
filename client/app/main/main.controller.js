'use strict';

angular.module('medicationReminderApp').factory('AudioService', function(){

	var softSound = new Audio('/assets/audio/Computer-Magic-Sound.mp3');
	var annoyingSound = new Audio('/assets/audio/Buzz-Sound.mp3')
	var playing = [false, false];
	var lastPlayed = [-1, -1];
	var AudioService = {

		play: function(num, type){
			if ((playing[type] == false) && (num > lastPlayed[type])){
				if (type == 0){
					softSound.play();
				} else {
					annoyingSound.play();
				}
	        	playing[type] = true;
	        	lastPlayed[type] = num;
	        }
	       	if (softSound.paused){
	       		playing[0] = false;
	       	}
	       	if (annoyingSound.paused){
	        	playing[1] = false;
	       	}      
		},
		remove: function(num){
			lastPlayed[0]--;
			lastPlayed[1]--;
		}

	};
	return AudioService;
});

angular.module('medicationReminderApp').factory('classService', function($window , $rootScope, $timeout, $interval){
	var status ={
		'warning' : 'alert alert-warning',
		'danger' : 'alert alert-danger',
		'success' : 'alert alert-success'
	};
	var divToAnimate = [];
	var animating = 0;
	var retType = 0;
	var interval;
	var classService = {

		set: function(num){
			for (var i = 0; i < num; i++){
				divToAnimate.push(0);
			};
		},
		getType: function(type, index){
			if (animating == 0){
				$interval.cancel(interval);
				retType = 1;
			}
			if (type == 'warning'){
				if (divToAnimate[index] > 0){
					return (retType == 1)? 'alert alert-warning' :  'alert alert-danger';
				} else {
					return 'alert alert-warning';
				}
			}
			return status[type];	
		},
		animate: function(index){
			var current = moment();
			if (divToAnimate[index] == 0){
				divToAnimate[index] = current;
				animating++;
			} 
			if (animating == 1) {
				interval = $interval(function () {
					if (retType == 0){
						retType = 1;
					} else {
						retType = 0;
					}
					var now  = moment();
					var count = 0;
					for (var i = 0; i < divToAnimate.length; i++){
						if ((divToAnimate[i] == 0) || (divToAnimate[i] == -1)){
							continue;
						} else {
							var diff = moment().diff(divToAnimate[i], 'seconds');
							if (diff >= 4){
								divToAnimate[i] = -1;
							} else {
								count++;
							}
						}
					}
					if (count == 0){
						animating = 0;
					}
				}, 300);			
			}
		},
		remove: function(index){
			divToAnimate.splice(index, 1);
		}
	};
	return classService;
});


angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window, $filter, AudioService, classService, Modal) {

    var start = moment().format('MM/DD/YYYY'),
        end = moment().add(1, 'day').format('MM/DD/YYYY');

    //Array to store missied and completed medicines
    $scope.missed = [];
    $scope.completed = [];
    $scope.ShowButton = [];

    $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {

    	//sorting received data by its time
        $scope.meds = $filter('orderBy')(meds.data, 'time');
        var diff;
        var now = moment();
        //process medicine data
       	for (var i = $scope.meds.length - 1; i >= 0 ; i--){
        	var med = $scope.meds[i];
        	if (med.completed){
        		$scope.completed.push(med);
        		$scope.meds.splice(i, 1);
        	} else {
        		diff = now.diff(moment(med.time).local(), 'minutes');
        		if (diff > 5){
        			$scope.missed.push(med);
        			$scope.meds.splice(i,1);
        		}
        	}
        	med.time = moment(med.time).format('MMMM Do YYYY, h:mm:ss a');
        }
        classService.set($scope.meds.length);
        for (var i = 0; i < $scope.meds.length; i++){
        	$scope.ShowButton.push(0);
       	}
    });

	$scope.getClass = function(type , index){
		return classService.getType(type, index);
	};

	//function used to open modal
	var fn = Modal.confirm.delete();

    $scope.CompleteMedicine = function(index, length, s){
    	//update to server
    	var p1 = (s == 'upcoming')? $scope.meds[index].name : $scope.missed[index].name;
    	var p2 = (s == 'upcoming')? $scope.meds[index].dosage : $scope.missed[index].dosage;

    	fn(p1, p2, function(x){
    		//return 1 if clicked yes, 0 if no on popup modal
    		if (x){
    			//check if length has changed or not
    			var l = (s == 'upcoming')? $scope.meds.length : $scope.missed.length;
    			if (l != length){
    				return 0;
    			} else {
	    			var med = (s == 'upcoming')? $scope.meds[index] : $scope.missed[index];
			    	med.time = moment(med.time, 'MMMM Do YYYY, h:mm:ss a').toDate();
			    	med.completed = true;
			    	med.d.f = moment().toDate();
			    	//use http put to update data
			    	$http.put('/api/medications/' + med._id , med).then( function(res){
			    		med.time = moment(med.time).format('MMMM Do YYYY, h:mm:ss a');
			    		$scope.completed.push(med);
			    		if ( s == 'upcoming'){
					    	$scope.meds.splice(index,1);
					    	$scope.ShowButton.splice(index,1);
					    } else {
					    	$scope.missed.splice(index, 1);
					    }
			    	});
			    }
    		} 
    	});  	
    };

    var playing = 0; 
    $window.setInterval(function () {
        $scope.currentTime = moment().format('MMMM Do YYYY, h:mm:ss a');
        var diff;
        for (var i = 0 ; i < $scope.meds.length; i++){
        	diff = moment().diff(moment($scope.meds[i].time, 'MMMM Do YYYY, h:mm:ss a'), 'seconds');
        	if ((diff >= -300) && (diff < 300)){
        		$scope.ShowButton[i] = 1;
        		if (diff == 0){
        			//if its time, play audio and show animation
        			AudioService.play(i, 0);
        			classService.animate(i);

        		}
        	}  else if (diff >= 300){
        		//if longer than 5 mins, remove from upcoming to missed secions
        		AudioService.play(i, 1);
        		$scope.ShowButton[i] = 0;
        		var med = $scope.meds[i];
		    	$scope.missed.push(med);
		    	$scope.meds.splice(i,1);
		    	$scope.ShowButton.splice(i,1);
		    	AudioService.remove(i);
		    	classService.remove(i);
		    	break;
        	} else {
        		break;
        	}
        }
        $scope.$apply();
    }, 1000);

});
