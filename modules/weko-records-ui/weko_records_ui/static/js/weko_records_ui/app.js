angular.module('myApp', ['ui.bootstrap'])
 .controller("ItemController",
  function($scope, $modal, $http, $window) {
   $scope.openConfirm = function(message, url, rdt) {
    var modalInstance = $modal.open({
     templateUrl: "confirm-modal.html",
     controller: "ConfirmController",
     resolve: {
      msg: function() {
       return message;
      }
     }
    });
    modalInstance.result.then(function() {
     $http.delete(url).then(
      function(response) {
       // success callback
       $window.location.href = rdt;
      },
      function(response) {
       // failure call back
       console.log(response);
      }
     );
    });
   };

    $scope.showChangeLog = function(deposit) {
        // call api for itself to catch field deposit
        // Call service to catch version by deposit with api /api/files/
        $('#bodyModal').children().remove();
        $http({
            method: 'GET',
            url: `/api/files/${deposit}?versions`,
        }).then(function successCallback(response) {
            $('#bodyModal').append(createRow(response['data']));
        }, function errorCallback(response) {
            console.log('Error when trigger api /api/files');
        });
    }

    versionPrivacyChanged = function(bucket_id, key, version_id, index, radio) {
      var showVersionPrivacyLoading = function(show) {
        if (show) {
          $("#version_radios_" + index).addClass('hidden');
          $("#version_loading_" + index).removeClass('hidden');
        } else {
          $("#version_loading_" + index).addClass('hidden');
          $("#version_radios_" + index).removeClass('hidden');
        }
      }

      var revertCheckedStatus = function(value) {
        if (value == 1) {
          // Change radio 0 to checked
          $("input[name=radio_" + index + "][value='0']").prop("checked",true);
        } else {
          // Change radio 1 to checked
          $("input[name=radio_" + index + "][value='1']").prop("checked",true);
        }
      }

      // Call the API to change the privacy status of version
      // If api success, show the download link (attach to version file name) if public checked
      // Otherwise, revert the checked status and do nothing + output error to console
      var updateVersionPrivacy = function(value) {
        $.ajax({
          method: 'PUT',
          url: '/file_version/update',
          async: true,
          cache: false,
          data: {
            "bucket_id": bucket_id,
            "key": key,
            "version_id": version_id,
            "is_show": value
          },
          success: function(data, status, xhr){
            showVersionPrivacyLoading(false);

            if (data.status == 1) {
              let element = $("#version_link_" + index);
              let link = $("#link_" + index).val();
              let txt_link = value == 1 ? `<a href="${link}">${element.text()}</a>` : element.text();
              element.html(txt_link);
            } else {
              // Revert the checked radio
              revertCheckedStatus(radio.value)
              // Log to console
              console.log(data.msg)
            }
          },
          error: function(status, error){
            showVersionPrivacyLoading(false);
            // Revert the checked radio
            revertCheckedStatus(radio.value)
            // Log to console
            console.log(error);
          }
        });
      }

      showVersionPrivacyLoading(true);
      updateVersionPrivacy(radio.value);
    }

    function createRow(response) {
        let results = '';
        const bucket_id = response.id;
        const contents = response.contents;
        response.contents.sort(function(first, second) {
            return second.updated - first.updated;
        });
        let txt_filename = $('#txt_filename').val()
        let txt_show = $('#txt_show').val()
        let txt_hide = $('#txt_hide').val()
        let is_logged_in = $('#txt_is_logged_in').val()

        // Remove the versions which does not match the current file
        for (let index = 0; index < contents.length; index++) {
            const ele = contents[index];
            if (ele.key != txt_filename) {
              // Remove this item
              contents.splice(index, 1);
              index--;
            }
        }

        for (let index = 0; index < contents.length; index++) {
            const ele = contents[index];

            const version_id = ele.version_id
            const key = ele.key

            // const isPublished = ele.pubPri === 'Published' ? 1 : 0;
            const nameRadio = `radio_${index}`;
            let radio = index == 0 ? "" : `
            <div id="version_radios_${index}" class="radio">
                <label style="margin-left: 5px">
                  <input type="radio" name="${nameRadio}" value="1" ${ele.is_show ? " checked " : ""} onchange="versionPrivacyChanged(\'${bucket_id}\', \'${key}\', \'${version_id}\', ${index}, this)">${txt_show}
                </label>
                <label style="margin-left: 5px">
                  <input type="radio" name="${nameRadio}" value="0" ${!ele.is_show ? " checked " : ""} onchange="versionPrivacyChanged(\'${bucket_id}\', \'${key}\', \'${version_id}\', ${index}, this)">${txt_hide}
                </label>
            </div>
            <div id="version_loading_${index}" class="hidden fa fa-circle-o-notch fa-spin text-center></div>
            `;
            // if (!isPublished) {
            //   radio = `
            //     <div class="radio">
            //       <div class="row">
            //         <div>
            //             <label><input type="radio" name="${nameRadio}">Published</label>
            //         </div>
            //         <div>
            //           <label><input type="radio" name="${nameRadio}" checked>Private</label>
            //         </div>
            //       </div>
            //     </div>
            //   `;
            // }

            let version = contents.length - index;
            if (index === 0) {
                version = 'Current';
            }

            // Check the permission of file to be able download or not
            let txt_link = index != 0 && !ele.is_show ? ele.key : `<a href="${ele.links.self}">${ele.key}</a>`

            let size = formatBytes(ele.size, 2);

            // Checksum
            var checksum = ele.checksum
            var checksumIndex = ele.checksum.indexOf(":")
            if (checksumIndex != -1) {
              checksum = ele.checksum.substr(0, checksumIndex) + " <span class=\"wrap\">" + ele.checksum.substr(checksumIndex + 1) + "</span>"
            }

            var username = ''
            if (is_logged_in == 'True' && ele.uploaded_owners && ele.uploaded_owners.created_user) {
              username =  ele.uploaded_owners.created_user.username;
            }

            results += `
            <tr>
                <td>
                  <input type="hidden" id="link_${index}" value="${ele.links.self}"/>
                  ${version}
                </td>
                <td class="nowrap">
                  ${formatDate(new Date(ele.updated))}
                </td>
                <td id="version_link_${index}">
                  ${txt_link}
                </td>
                <td>
                  ${size}
                </td>
                <td class="wrap">
                  ${checksum}
                </td>
                <td class="nowrap">
                  ${username}
                </td>
                <td>${radio}</td>
            </tr>
            `;

        }
        return results;
    }

    function formatDate(date) {
        let month = '' + (date.getMonth() + 1);
        let day = '' + date.getDate();
        let year = date.getFullYear();

        let hour = '' + date.getHours();
        let minute = '' + date.getMinutes();
        let second = '' + date.getSeconds();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        if (hour.length < 2) hour = '0' + hour;
        if (minute.length < 2) minute = '0' + minute;
        if (second.length < 2) second = '0' + second;

        return `${[year, month, day].join('-')}\t${[hour, minute, second].join(':')}`;
    }

    function formatBytes(a,b) {
        if (0 == a) return "0 Bytes";
        var c = 1024, d=b||2, e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], f = Math.floor(Math.log(a)/Math.log(c));
        return parseFloat((a/Math.pow(c,f)).toFixed(d)) + " (" + e[f] + ")";
    }
  }
 ).controller('ConfirmController',
  function($scope, $modalInstance, msg) {
   $scope.message = msg;

   $scope.ok = function() {
    $modalInstance.close();
   };
   $scope.cancel = function() {
    $modalInstance.dismiss();
   };
  });
