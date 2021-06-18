(function (angular) {
    // Bootstrap it!
    //＊詳細検索画面で使用するジャバスクリプトです
    angular.element(document).ready(function () {
        angular.module('searchDetail.controllers', []);
        function searchDetailCtrl($scope, $rootScope, $http, $location) {
            $scope.condition_data = [];
            $scope.detail_search_key = [];
            $scope.default_search_key = [];
            $scope.search_community = document.getElementById('community').value;
            $scope.search_type = "0";
            $scope.default_condition_data = [];
            $scope.currentLanguage = document.getElementById('currentLanguage').value;

            // page init
            $scope.initData = function (data) {
                json_obj = angular.fromJson(data)
                db_data = json_obj.condition_setting;

                angular.forEach(db_data, function (item, index, array) {
                    // useable
                    if (item.useable_status) {
                        var obj_key = {
                            id: '',
                            contents: '',
                            inx: 0,
                            disabled_flg: false
                        };
                        obj_key.id = item.id;
                        // ＊ここから詳細検索の項目名を設定している、これはcontents_valueに使用している言語のものがあればそれ、無ければcontentsを取ってくるようにした
                        if (item.contents_value){
                            if (item.contents_value[$scope.currentLanguage]){
                                obj_key.contents = item.contents_value[$scope.currentLanguage];}
                            else{
                                obj_key.contents = item.contents
                            }}
                        else{
                            obj_key.contents = item.contents //もとはこれだけ
                        }
                        //＊ここまで
                        obj_key.inx = index;
                        $scope.detail_search_key.push(obj_key);
                    };

                    // default display
                    if (item.default_display) {
                        var default_key = {
                            id: '',
                            contents: '',
                            inx: 0
                        };
                        default_key.id = item.id;
                        default_key.contents = item.contents;
                        default_key.inx = index;
                        $scope.default_search_key.push(default_key);
                    };
                });

                angular.forEach($scope.default_search_key, function (item, index, array) {
                    var obj_of_condition = {
                        selected_key: '',
                        key_options: [],
                        key_value: {}
                    };
                    obj_of_condition.selected_key = item.id;
                    obj_of_condition.key_options = $scope.detail_search_key;
                    obj_of_condition.key_value = angular.copy(db_data[item.inx]);
                    $scope.condition_data.push(obj_of_condition)
                });

                $scope.default_condition_data = angular.fromJson(angular.toJson($scope.condition_data));

                if (sessionStorage.getItem('btn') == 'detail-search') {
                    $scope.condition_data = angular.fromJson(sessionStorage.getItem('detail_search_conditions'));
                }

                $scope.update_disabled_flg();
            };

            // add button
            $scope.add_search_key = function () {
                var obj_of_condition = {
                    selected_key: '',
                    key_options: [],
                    key_value: {}
                }
                var flg = 0

                for (var sub_detail in $scope.detail_search_key) {
                    flg = 0

                    for (var sub_condition in $scope.condition_data) {
                        if ($scope.detail_search_key[sub_detail].id == $scope.condition_data[sub_condition].selected_key) {
                            flg = 1
                            break;
                        }
                    }

                    if (flg == 0) {
                        obj_of_condition.selected_key = $scope.detail_search_key[sub_detail].id;
                        obj_of_condition.key_options = $scope.detail_search_key;
                        obj_of_condition.key_value = angular.copy(db_data[$scope.detail_search_key[sub_detail].inx]);
                        $scope.condition_data.push(obj_of_condition)
                        break;
                    }
                }

                $scope.update_disabled_flg();
            };

            // delete button
            $scope.delete_search_key = function (index) {
                $scope.condition_data.splice(index, 1);
                $scope.update_disabled_flg();
            };
            // change_searc_key
            $scope.change_search_key = function (index, search_key) {
                var obj = $scope.get_search_key(search_key)
                $scope.condition_data.splice(index, 1, obj);
                $scope.update_disabled_flg();
            };

            // detail search
            $rootScope.getSettingDefault = function () {
                let data = null;

                $.ajax({
                    async: false,
                    method: 'GET',
                    url: '/get_search_setting',
                    headers: { 'Content-Type': 'application/json' },
                }).then(function successCallback(response) {

                    if (response.status === 1) {
                        data = response.data;
                    }

                }, function errorCallback(error) {
                    console.log(error);
                    return null;
                });

                if (data.dlt_keyword_sort_selected !== null
                    && data.dlt_keyword_sort_selected !== undefined) {
                    let key_sort = data.dlt_keyword_sort_selected;
                    let descOrEsc = "";

                    if (key_sort.includes("_asc")) {
                        key_sort = key_sort.replace("_asc", "");
                    }

                    if (key_sort.includes("_desc")) {
                        descOrEsc = "-";
                        key_sort = descOrEsc + key_sort.replace("_desc", "");
                    }

                    return {
                        key: "sort",
                        value: key_sort
                    };
                }
            }

            $scope.detail_search = function () {
                let query_str = "";
                let data = $rootScope.getSettingDefault();

                // Add simple search query to detail search one
                $scope.search_q = document.getElementById('q').value;

                query_str = query_str + "&search_type=" + $scope.search_type + "&q=" + $scope.search_q;

                if ($scope.search_community != "") {
                    query_str = query_str + "&community=" + $scope.search_community;
                }

                angular.forEach($scope.condition_data, function (item, index, array) {
                    if (item.key_value.inputType == "text") {
                        query_str = query_str + "&" + item.key_value.id + "=" + item.key_value.inputVal;
                    }
                    if (item.key_value.inputType == "range") {
                        var inputValFrom = item.key_value.inputVal_from;
                        var inputValTo = item.key_value.inputVal_to;
                        query_str = query_str + "&" + item.key_value.id + "_from=" + inputValFrom + "&" +
                                    item.key_value.id + "_to=" + inputValTo;
                    }
                    if (item.key_value.inputType == "geo_distance") {
                        var inputValLat = item.key_value.inputVal_lat;
                        var inputValLon = item.key_value.inputVal_lon;
                        var inputValDistance = item.key_value.inputVal_distance;
                        query_str = query_str + "&" + item.key_value.id + "_lat=" + inputValLat + "&" +
                                    item.key_value.id + "_lon=" + inputValLon +  "&" +
                                    item.key_value.id + "_distance=" + inputValDistance;
                    }

                    if (item.key_value.inputType == "dateRange") {
                        var inputValFrom = item.key_value.inputVal_from;
                        var inputValTo = item.key_value.inputVal_to;

                        switch (inputValFrom.length) {
                            // YYYY
                            case 4:
                                inputValFrom = inputValFrom + '01' + '01';
                                break;
                            // YYYYMM
                            case 6:
                                inputValFrom = inputValFrom + '01';
                                break;
                            // YYYYMMDD
                            case 8:
                                var y = inputValFrom.substring(0, 4);
                                var m = inputValFrom.substring(4, 6);
                                var d = inputValFrom.substring(6, 8);
                                var date = new Date(y + '-' + m + '-' + d);

                                // Fix invalid date to the first day of the month
                                if (!(date instanceof Date) || isNaN(date)) {
                                    var inputValFrom = y + m + '01';
                                }

                                break;
                            default:
                                inputValFrom = '';
                        }

                        switch (inputValTo.length) {
                            // YYYY
                            case 4:
                                inputValTo = inputValTo + '12' + '31';
                                break;
                            // YYYYMM
                            case 6:
                                var y = inputValTo.substring(0, 4);
                                var m = inputValTo.substring(4, 6);
                                var d =new Date(Number(y), Number(m), 0).getDate();
                                inputValTo = inputValTo + String(d).padStart(2, '0');
                                break;
                            //YYYYMMDD
                            case 8:
                                var y = inputValTo.substring(0, 4);
                                var m = inputValTo.substring(4, 6);
                                var d = inputValTo.substring(6, 8);
                                var date = new Date(y + '-' + m + '-' + d);
                                if (date instanceof Date && !isNaN(date)) {
                                    inputVal = String(date.getFullYear()).padStart(4, '0');
                                               + String(date.getMonth() + 1).padStart(2, '0');
                                               + String(date.getDate()).padStart(2, '0');

                                // Fix invalid date to the last day of the month
                                } else {
                                    var validDay = new Date(Number(y), Number(m), 0).getDate();
                                    inputValTo = y + m + String(validDay).padStart(2, '0');
                                }

                                break;
                            default:
                                inputValTo = '';
                        }

                        query_str = query_str + "&" + item.key_value.id + "_from=" + inputValFrom + "&" +
                                    item.key_value.id + "_to=" + inputValTo;
                    }

                    if (item.key_value.inputType == "checkbox_list") {
                        let key_arr = "";
                        let firstItem = true;
                        angular.forEach(item.key_value.check_val, function (item, index, array) {
                            if (item.checkStus) {
                                let currentKey = firstItem ? item.id : "," + item.id;
                                key_arr = key_arr + currentKey;
                                firstItem = false
                            }
                        });
                        query_str = query_str + "&" + item.key_value.id + "=" + key_arr;
                    }

                    if (item.key_value.inputType == "selectbox") {
                        query_str = query_str + "&" + item.key_value.id + "=" + item.key_value.inputVal;
                    }

                    if (item.key_value.inputType == "radio_list") {
                        query_str = query_str + "&" + item.key_value.id + "=" + item.key_value.inputVal;
                    }

                    if (item.key_value.mappingFlg) {
                        var schema_or_arr = "";
                        let firstItem = true;
                        angular.forEach(item.key_value.sche_or_attr, function (item, index, array) {
                            if (item.checkStus) {
                                let currentKey = firstItem ? item.id : "," + item.id;
                                schema_or_arr = schema_or_arr + currentKey;
                                firstItem = false;
                            }
                        });
                        query_str = query_str + "&" + item.key_value.mappingName + "=" + schema_or_arr;
                    }
                });

                sessionStorage.setItem('detail_search_conditions', angular.toJson($scope.condition_data));
                if (data !== null && data.key !== null && data.value !== null) {
                    query_str += "&" + data.key + "=" + data.value;
                }

                let url = '/search?page=1' + query_str;

                if (angular.element('#item_management_bulk_update').length != 0) {
                    url = '/admin/items' + url + '&item_management=update';
                } else if (angular.element('#item_management_bulk_delete').length != 0) {
                    url = '/admin/items' + url + '&item_management=delete';
                }

                // URI-encode '+' in advance for preventing from being converted to '%20'(space)
                url = url.replace(/\+/g, encodeURIComponent('+'))
                window.location.href = url
            }

            $scope.detail_search_clear = function () {
                $scope.reset_data();
                sessionStorage.setItem('detail_search_conditions', angular.toJson($scope.condition_data));
            }

            // set search options
            $scope.update_disabled_flg = function () {
                var update_flg = 0;

                for (var sub_default_key in $scope.detail_search_key) {
                    update_flg = 0;

                    for (var sub_condition in $scope.condition_data) {
                        if ($scope.detail_search_key[sub_default_key].id == $scope.condition_data[sub_condition].selected_key) {
                            update_flg = 1;
                            break;
                        }
                    }

                    if (update_flg == 1) {
                        $scope.detail_search_key[sub_default_key].disabled_flg = true;
                    } else {
                        $scope.detail_search_key[sub_default_key].disabled_flg = false;
                    }
                }

            }

            //restart
            $scope.reset_data = function () {
                $scope.condition_data = [];

                for (var sub_default_key in $scope.detail_search_key) {
                    $scope.detail_search_key[sub_default_key].disabled_flg = false;
                }

                angular.forEach($scope.default_search_key, function (item, index, array) {
                    var obj_of_condition = {
                        selected_key: '',
                        key_options: [],
                        key_value: {}
                    };
                    obj_of_condition.selected_key = item.id;
                    obj_of_condition.key_options = $scope.detail_search_key;
                    obj_of_condition.key_value = angular.copy(db_data[item.inx]);
                    $scope.condition_data.push(obj_of_condition);
                });

                $scope.update_disabled_flg();
            }

            // set search options
            $scope.get_search_key = function (search_key) {
                var obj_of_condition = {
                    selected_key: '',
                    key_options: [],
                    key_value: {}
                };

                for (var sub_default_key in $scope.detail_search_key) {

                    if ($scope.detail_search_key[sub_default_key].id == search_key) {
                        obj_of_condition.selected_key = search_key;
                        obj_of_condition.key_options = $scope.detail_search_key;
                        obj_of_condition.key_value = angular.copy(db_data[$scope.detail_search_key[sub_default_key].inx]);
                        break;
                    }
                }

                return obj_of_condition;
            }

            // $scope.inputDataOnEnter = function () {
            //     var daterangeItems = $scope.condition_data.filter(function (item) {
            //         return item.key_value.inputType == "dateRange";
            //     })

            //     angular.forEach(daterangeItems, function(item) {
            //         var elem = angular.element(document.getElementsById(item.key_value.id + '_from'));
            //         var inputVal = elem.val();
            //     })
            // }

        }

        // Inject depedencies
        searchDetailCtrl.$inject = [
            '$scope',
            '$rootScope',
            '$http',
            '$location'
        ];
        angular.module('searchDetail.controllers').controller('searchDetailCtrl', searchDetailCtrl);
        angular.module('searchDetailModule', ['searchDetail.controllers']);
        angular.module('searchDetailModule', ['searchDetail.controllers']).config(
            [
                '$interpolateProvider', function ($interpolateProvider) {
                $interpolateProvider.startSymbol('[[');
                $interpolateProvider.endSymbol(']]');
            }]
        );
        angular.bootstrap(
            document.getElementById('search_detail'), ['searchDetailModule']);
    });
})(angular);
