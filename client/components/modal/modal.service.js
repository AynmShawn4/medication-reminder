'use strict';

angular.module('medicationReminderApp')
  .factory('Modal', function ($rootScope, $modal) {
    /**
     * Opens a modal
     * @param  {Object} scope      - an object to be merged with modal's scope
     * @param  {String} modalClass - (optional) class(es) to be applied to the modal
     * @return {Object}            - the instance $modal.open() returns
     */
    function openModal(scope, modalClass) {
      var modalScope = $rootScope.$new();
      scope = scope || {};
      modalClass = modalClass || 'modal-default';

      angular.extend(modalScope, scope);

      return $modal.open({
        templateUrl: 'components/modal/modal.html',
        windowClass: modalClass,
        scope: modalScope
      });
    }

    // Public API here
    return {

      /* Confirmation modals */
      confirm: {

        /**
         * Create a function to open a delete confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
         * @param  {Function} del - callback, ran when delete is confirmed
         * @return {Function}     - the function to open the modal (ex. myModalFn)
         */
        delete: function(del) {
          /**
           * Open a delete confirmation modal
           * @param  {String} name   - name or info to show on modal
           * @param  {All}           - any additional args are passed staight to del callback
           */
          return function(x , y, d) {

            var deleteModal;
            d = d || angular.noop;
            deleteModal = openModal({
              modal: {
                dismissable: true,
                title: 'Confirm Finish',
                html: '<p>Are you sure you finished <strong>' + x + '</strong> with dosage ' + y + '?</p>',
                buttons: [{
                  classes: 'btn-primary',
                  text: 'Yes',
                  click: function() {
                    deleteModal.close(1);
                  }
                }, {
                  classes: 'btn-default',
                  text: 'Cancel',
                  click: function() {
                    deleteModal.dismiss(0);
                  }
                }]
              }
            }, 'modal-primary');

            deleteModal.result.then(function(event) {    
               d(event);
            }, function(event){
               d(event);
            });
          };
        }
      }
    };
  });
