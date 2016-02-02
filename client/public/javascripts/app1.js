
var app = angular.module('app', ['ngTouch', 'ui.grid', 'ui.grid.selection', 'ui.grid.pinning']);

app.controller('mainController', function($scope, $http, $timeout) {
    //$scope.formData = {};
    //$scope.travelerData = {};
    $scope.gridOptions = {
     
      enableColumnMenus: false,
      enableSorting: false,
      //rowTemplate: '<div ng-class="{\'red\':row.entity.ridestatus===\'CREATED\'}" <div ng-repeat="col in colContainer.renderedColumns track by col.colDef.field"  class="ui-grid-cell" ui-grid-cell></div></div>',

      //rowTemplate: '<div ng-class="{\'red\':row.entity.delay>5, \'green\':row.entity.delay<=5}" <div ng-repeat="col in colContainer.renderedColumns track by col.colDef.name"  class="ui-grid-cell" ui-grid-cell></div></div>',
      columnDefs: [
        {name:'Pickup Day', field:'pickupday', width:200},
        {name: 'Pickup Time', field: 'initialdueridetimestamp', width:100, enableCellEdit: false },
        {name:'Flight/Train Nbr', field:'travelid', width:125},
        {name:'From', field:'fromplace'},
        {name: 'Zone', field: 'g7pickupzone'},
        {name: 'Status', field: 'ridestatus', width:100, enableCellEdit: false }
      ],

    }

    $scope.callAtTimeout = function() {
      $timeout(function(){$scope.callAtTimeout();}, 60000);
      $http.get('/api/v1/travelers')
        .success(function(data) {
            for (i=0; i < data.length; i++) {
                var date = new Date(data[i].initialdueridetimestamp*1000);
                data[i].initialdueridetimestamp = date.format("HH:MM");                 
            }

          $scope.gridOptions.data = data;
          console.log(data);
        })
        .error(function(error) {
          console.log('Error: ' + error);
        });
    }

    $timeout(function(){$scope.callAtTimeout();}, 30000);

    $http.get('/api/v1/travelers')
      .success(function(data) {
        for (i=0; i < data.length; i++) {
            var date = new Date(data[i].initialdueridetimestamp*1000);
            data[i].initialdueridetimestamp = date.format("HH:MM");                 
        }
        $scope.gridOptions.data = data;
        console.log(data);
      })
      .error(function(error) {
        console.log('Error: ' + error);
      });

});

function callAtInterval() {
  console.log("Interval...");
}
