var app = angular.module('app', ['ngTouch', 'ui.grid', 'ui.grid.expandable', 'ui.grid.selection', 'ui.grid.pinning']);

app.controller('mainController', function($scope, $http, $timeout) {
    //$scope.formData = {};
    //$scope.travelerData = {};
    $scope.gridOptions = {
      expandableRowTemplate: 'expandRow',
      expandableRowHeight: 150,
      expandableRowScope: {
        subGridVariable: 'subGridScopeVariable'
      },
      enableColumnMenus: false,
      enableSorting: false,
      rowTemplate: '<div ng-class="{\'red\':row.entity.delay>15,  \'yellow\':row.entity.delay<10 && row.entity.delay>0,  \'green\':row.entity.delay<1}" <div ng-repeat="col in colContainer.renderedColumns track by col.colDef.field"  class="ui-grid-cell" ui-grid-cell></div></div>',

      columnDefs: [
        {name:'Sched Time', field:'origarrtime', width:120},
        {name:'Est   Time', field:'arrtime', width:120},
        {name: 'Delay', field: 'delay', width:75, enableCellEdit: false },
        {name:'Flight/Train Nbr', field:'travelid', width:125},
        {name:'From', field:'internationalname', width: 175},
        {name: 'Place', field: 'zone', width: 150},
        {name: 'Status', field: 'status', width:100, enableCellEdit: false },
        {name: 'Nbr Travelers', field: 'nbrtravelers', width: 150, enableCellEdit: false }
      ],

    }

    $scope.callAtTimeout = function() {

      $timeout(function(){$scope.callAtTimeout();}, 60000);
      $http.get('/api/v1/travelboard')
        .success(function(data) {

          for(i=0; i < data.length; i++){
            var date = new Date(data[i].arrtime*1000);
            data[i].arrtime = date.format("HH:MM dd/mm");
            date = new Date(data[i].origarrtime*1000);
            data[i].origarrtime = date.format("HH:MM dd/mm");
            data[i].subGridOptions = {
              enableSorting: false,
              enableColumnMenus: false,
              columnDefs: [{name:"ID", field:"ridenumber", width: 100},{name:"Subscription Code", field:"subscriptioncode", width: 125},{name:"Requested By",field:"requestedby", width: 150}],
              data: data[i].travelers
            }
          }
          $scope.gridOptions.data = data;
          console.log(data);
        })
        .error(function(error) {
          console.log('Error: ' + error);
        });
    }

    $timeout(function(){$scope.callAtTimeout();}, 30000);

    $http.get('/api/v1/travelboard')
      .success(function(data) {
        //$scope.travelerData = data;
        for(i=0; i < data.length; i++){
            var date = new Date(data[i].arrtime*1000);
            data[i].arrtime = date.format("HH:MM dd/mm");
            date = new Date(data[i].origarrtime*1000);
            data[i].origarrtime = date.format("HH:MM dd/mm");
          data[i].subGridOptions = {
            enableSorting: false,
            enableColumnMenus: false,
            columnDefs: [{name:"ID", field:"ridenumber", width: 100},
                         {name:"Subscription Code", field:"subscriptioncode", width: 125},
                         {name:"Passenger",field:"requestedby", width: 150},
                         {name:"Requested By",field:"refclient", width: 150}],
            data: data[i].travelers
          }
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
