/**
 * Defaults
 *
 * @options {string} [username] - Basic auth username for the API
 * @options {string} [password] - Basic auth password for the API
 */
const DEFAULTS = {
  options: {
    username: '',
    password: '',
    activity: '',
  },
};

module.exports = (BaseDirective) => {
  /*
   * List of kursister, with abbility to edit.
   */
  class inkaDirective extends BaseDirective {
    /**
     * @static
     *
     * @return {Object} default attrs and options
     */
    static get DEFAULTS() {
      return DEFAULTS;
    }

    /**
     * Renders an editable list of Participants for an activity type, ordered by the activity dates
     *
     * @param {string} username
     * @param {string} password
     * @param {string} activityType
     * @return {string} rendered list
     */
    input() {
      const AUTH_KEY = Buffer.from(`${this.options.username}:${this.options.password}`).toString('base64');
      let activityApiName = '';
      switch (this.options.activity) {
        case 'workshops':
          activityApiName = 'workshops';
          break;
        case 'rejser':
          activityApiName = 'journeys';
          break;
        default:
          activityApiName = 'journeys';
      }

      console.log(this.options.activity, activityApiName);
      console.log(this.options.username, this.options.password);

      return `
      <div id="inkaActivityParticipants"></div>
      <style>
        #participants table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }

        #participants td, #participants th {
          border: 1px solid #dddddd;
          text-align: center;
          padding: 8px;
        }

        #participants tr:nth-child(even) {
          background-color: #dddddd;
        }

        #participants form input {
          -webkit-appearance: auto;
          -moz-appearance: auto;
          appearance: auto;
        }

        /* Style the tab */
       .tab {
         overflow: hidden;
         border: 1px solid #ccc;
         background-color: #f1f1f1;
       }

       /* Style the buttons that are used to open the tab content */
       .tab button {
         background-color: inherit;
         float: left;
         border: none;
         outline: none;
         cursor: pointer;
         padding: 14px 16px;
         transition: 0.3s;
       }

       /* Change background color of buttons on hover */
       .tab button:hover {
         background-color: #ddd;
       }

       /* Create an active/current tablink class */
       .tab button.active {
         background-color: #ccc;
       }

       /* Style the tab content */
       .tabcontent {
         display: none;
         padding: 6px 12px;
         border: 1px solid #ccc;
         border-top: none;
       }

       .success-msg, {
         margin: 10px 0;
         padding: 10px;
         border-radius: 3px 3px 3px 3px;
         color: #270;
         background-color: #DFF2BF;
       }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js"></script>
      <script>
        var activities = [], participants = [];

        var activitiesPromise = new Promise((resolve) => {
          fetch('https://api.inkaspirit.dk/api/${activityApiName}', { credentials: 'same-origin' })
            .then(response => response.json())
            .then(jsonData => {
              if(jsonData.message === 'success') {
                activities = jsonData.data;
                resolve()
              } else {
                handleError(jsonData)
              }
              return;
            })
            .catch(ex => handleError(ex))
        });

        var participantsPromise = new Promise((resolve) => {
          fetch('https://api.inkaspirit.dk/secure/api/participants', {
            credentials: 'same-origin',
            headers: {
              'Authorization': 'Basic ${AUTH_KEY}'
            }
          })
            .then(response => response.json())
            .then(jsonData => {
              if(jsonData.message === 'success') {
                participants = jsonData.data;
                resolve()
              } else {
                handleError(jsonData)
              }
              return;
            })
            .catch(ex => handleError(ex))
        });

        Promise.all([activitiesPromise, participantsPromise]).then(() => renderPage());

        var participantsDiv = document.getElementById('inkaActivityParticipants');

        var renderPage = () => {
          var renderHTML = '';

          // Move Participants div outside of the form, remove the form
          var content = document.getElementsByClassName('content')[0];
          content.appendChild(participantsDiv);
          document.getElementsByClassName('form')[0].style.display = 'none';
          content.style.margin = '0';
          content.style.maxWidth = 'none';

          // Sort activities by date
          activities.sort((a, b) => {
            a = JSON.parse(a.content);
            b = JSON.parse(b.content);
            var dateA = new Date(a.start_date).valueOf();
            var dateB = new Date(b.start_date).valueOf();
            return dateA-dateB
          });

          // Render tab links
          renderHTML += '<div class="tab">';
            activities.forEach(activity => {
              // Create slug
              activity = JSON.parse(activity.content);

              renderHTML += '<button class="tablinks" onclick="openActivity(event, \\'' + activity.permalink + '\\')">' + activity.title + '</button>'
            });
          renderHTML += '</div>';

          // Render tab content
          activities.forEach(activity => {
            // Create slug
            var activityID = activity.id;
            activity = JSON.parse(activity.content);

            renderHTML += '<div id="' + activity.permalink + '" class="tabcontent">';
              // Render activity title and date
              renderHTML += '<h3>' + activity.title + ' - ' + activity.start_date + '</h3><br />';

              // Render participants
              renderHTML += '<form id="activity-' + activityID + '">';
                renderHTML += '<table>';
                  renderHTML += '<tr>';
                    renderHTML += '<th>Betalt</th>';
                    renderHTML += '<th>Faktura sendt</th>';
                    renderHTML += '<th>Fornavn</th>';
                    renderHTML += '<th>Efternavn</th>';
                    renderHTML += '<th>Telefon</th>';
                    renderHTML += '<th>Email</th>';
                    renderHTML += '<th>Kommentar</th>';
                  renderHTML += '</tr>';
                  participants.forEach(participant => {
                    if(participant.activity_id === activityID) {
                      renderHTML += '<tr id="participant-' + participant.id + '">';
                        renderHTML += '<td><input type="checkbox" name="' + participant.id + '-payment-received"' + (participant.payment_received ? ' checked>' : '>') + '</td>';
                        renderHTML += '<td><input type="checkbox" name="' + participant.id + '-invoice-sent"' + (participant.invoice_sent ? ' checked>' : '>') + '</td>';
                        renderHTML += '<td>' + participant.first_name + '</td>';
                        renderHTML += '<td>' + participant.last_name + '</td>';
                        renderHTML += '<td>' + participant.phone_number + '</td>';
                        renderHTML += '<td>' + participant.email_address + '</td>';
                        renderHTML += '<td>' + (participant.comment ? participant.comment : '') + '</td>';
                        renderHTML += '<td><input class="button" value="Slet" onClick="deleteParticipant(\\'' + participant.id + '\\')"></td>';
                      renderHTML += '</tr>'
                    }
                  });
                renderHTML += '</table>';
                renderHTML += '<input class="button" type="submit" value="Opdater tilmeldte">';
                renderHTML += '<div id="activity-' + activityID + '-response" class="success-msg"></div>';
              renderHTML += '</form>';
            renderHTML += '</div>'
          });

          // Insert renderHTML into the page
          participantsDiv.innerHTML = renderHTML;

          // Set up event listeners for Activity forms
          activities.forEach(activity => {
            // Create slug
            var activityID = activity.id;
            var activityElementID = 'activity-' + activityID;
            document.getElementById(activityElementID).addEventListener('submit', e => {
              e.preventDefault();
              participants.forEach(participant => {
                if(participant.activity_id === activityID) {
                  var paymentReceivedElement = participant.id + '-payment-received';
                  var invoiceSentElement = participant.id + '-invoice-sent';
                  var payment_received = e.target[paymentReceivedElement].checked ? 1 : 0;
                  var invoice_sent =  e.target[invoiceSentElement].checked ? 1 : 0;

                  // Opdater kursist in db
                  fetch('https://api.inkaspirit.dk/secure/api/participant/' + participant.id, {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: {
                      'Authorization': 'Basic ${AUTH_KEY}',
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        invoice_sent,
                        payment_received,
                    })
                  })
                    .then(response => response.json())
                    .then(jsonData => {
                      if(jsonData.message === 'success') {
                        var responseDiv = document.getElementById('activity-' + activityID + '-response');
                        responseDiv.innerHTML = 'De tilmeldte er blevet opdateret!'
                      } else {
                        handleError(jsonData)
                      }
                      return;
                    })
                    .catch(ex => handleError(ex))
                }
              })
            })
          })
        };

        var handleError = e => {
           participantsDiv.innerHTML = '<p>' + (e.error ? e.error : 'Der skete en fejl. Skriv venligst til webmasteren for at få løst dette problem') + '</p>'
        };

        var deleteParticipant = id => {
          // TODO: Update this to real URL
          fetch('https://api.inkaspirit.dk/secure/api/participant/' + id, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
              'Authorization': 'Basic ${AUTH_KEY}',
            }
          })
            .then(response => response.json())
            .then(jsonData => {
              if(jsonData.message === 'deleted') {
                var participantRow = document.getElementById('participant-' + id);
                participantRow.parentNode.removeChild(participantRow)
              } else {
                handleError(jsonData)
              }
              return;
            })
            .catch(ex => handleError(ex))
        };

        var openActivity = (evt, tabName) => {
          evt.preventDefault();

          // Declare all variables
          var i, tabcontent, tablinks;

          // Get all elements with class="tabcontent" and hide them
          tabcontent = document.getElementsByClassName("tabcontent");
          for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
          }

          // Get all elements with class="tablinks" and remove the class "active"
          tablinks = document.getElementsByClassName("tablinks");
          for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
          }

          // Show the current tab, and add an "active" class to the button that opened the tab
          document.getElementById(tabName).style.display = "block";
          evt.currentTarget.className += " active";
        }
      </script>
      `;
    }
  }

  return inkaDirective;
};
