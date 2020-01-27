const fetch = require('node-fetch');

/**
 * Defaults
 *
 * @options {string} [username] - Basic auth username for the API
 * @options {string} [password] - Basic auth password for the API
 */
const DEFAULTS = {
  options: {
    username: '',
    password: ''
  }
};

module.exports = (BaseDirective) => {
  /*
   * List of kursister, with abbility to edit.
   */
  class KursisterDirective extends BaseDirective {
    /**
     * @static
     *
     * @return {Object} default attrs and options
     */
    static get DEFAULTS() {
      return DEFAULTS;
    }

    /**
     * Renders the editable list of Kursister, ordered by upcoming Kurser
     *
     * @param {string} username
     * @param {string} password
     * @return {string} rendered input
     */
    input() {
      const AUTH_KEY = Buffer.from(this.options.username + ':' + this.options.password).toString('base64')

      return `
      <div id="inkaJourneyParticipants"></div>
      <style>
        #kursister table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }

        #kursister td, #kursister th {
          border: 1px solid #dddddd;
          text-align: center;
          padding: 8px;
        }

        #kursister tr:nth-child(even) {
          background-color: #dddddd;
        }

        #kursister form input {
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
        var kurser = [], kursister = [];

        var kurserPromise = new Promise((resolve, reject) => {
          fetch('http://localhost:3000/api/kurser', { credentials: 'same-origin' })
            .then(response => response.json())
            .then(jsonData => {
              if(jsonData.message === 'success') {
                kurser = jsonData.data;
                resolve()
              } else {
                handleError(jsonData)
              }
              return;
            })
            .catch(ex => handleError(ex))
        })

        var kursisterPromise = new Promise((resolve, reject) => {
          fetch('https://api.compassionpsykologerne.dk/secure/api/kursister', {
            credentials: 'same-origin',
            headers: {
              'Authorization': 'Basic ${AUTH_KEY}'
            }
          })
            .then(response => response.json())
            .then(jsonData => {
              if(jsonData.message === 'success') {
                kursister = jsonData.data
                resolve()
              } else {
                handleError(jsonData)
              }
              return;
            })
            .catch(ex => handleError(ex))
        })

        Promise.all([kurserPromise, kursisterPromise]).then(() => renderPage())

        var renderPage = () => {
          var renderHTML = ''

          // Move kursister div outside of the form, remove the form
          var content = document.getElementsByClassName('content')[0]
          var kursisterDiv = document.getElementById('kursister')
          content.appendChild(kursisterDiv)
          document.getElementsByClassName('form')[0].style.display = 'none'
          content.style.margin = '0'
          content.style.maxWidth = 'none'

          // Sort kurser by date
          kurser.sort((a, b) => {
            a = JSON.parse(a.content)
            b = JSON.parse(b.content)
            var dateA = new Date(a.tidspunkt).valueOf()
            var dateB = new Date(b.tidspunkt).valueOf()
            return dateA-dateB
          })

          // Render tab links
          renderHTML += '<div class="tab">'
            kurser.forEach(kursus => {
              // Create slug
              var slug = generateSlug(JSON.parse(kursus.content).title, kursus.id)
              kursus = JSON.parse(kursus.content)

              renderHTML += '<button class="tablinks" onclick="openKursus(event, \\'' + slug + '\\')">' + kursus.title + '</button>'
            })
          renderHTML += '</div>'

          // Render tab content
          kurser.forEach(kursus => {
            // Create slug
            var kursusID = kursus.id
            var slug = generateSlug(JSON.parse(kursus.content).title, kursusID)
            kursus = JSON.parse(kursus.content)

            renderHTML += '<div id="' + slug + '" class="tabcontent">'
              // Render kursus title and date
              renderHTML += '<h3>' + kursus.title + ' - ' + kursus.tidspunkt + '</h3><br />'

              // Render participants
              renderHTML += '<form id="kursus-' + kursusID + '">'
                renderHTML += '<table>'
                  renderHTML += '<tr>'
                    renderHTML += '<th>Betalt</th>'
                    renderHTML += '<th>Faktura sendt</th>'
                    renderHTML += '<th>Fornavn</th>'
                    renderHTML += '<th>Efternavn</th>'
                    renderHTML += '<th>Telefon</th>'
                    renderHTML += '<th>Email</th>'
                    renderHTML += '<th>Kommentar</th>'
                  renderHTML += '</tr>'
                  kursister.forEach(kursist => {
                    if(kursist.kursus === slug) {
                      renderHTML += '<tr id="kursist-' + kursist.id + '">'
                        renderHTML += '<td><input type="checkbox" name="' + kursist.id + '-betalt"' + (kursist.betalt ? ' checked>' : '>') + '</td>'
                        renderHTML += '<td><input type="checkbox" name="' + kursist.id + '-fakturasendt"' + (kursist.fakturasendt ? ' checked>' : '>') + '</td>'
                        renderHTML += '<td>' + kursist.fornavn + '</td>'
                        renderHTML += '<td>' + kursist.efternavn + '</td>'
                        renderHTML += '<td>' + kursist.telefon + '</td>'
                        renderHTML += '<td>' + kursist.email + '</td>'
                        renderHTML += '<td>' + (kursist.kommentar ? kursist.kommentar : '') + '</td>'
                        renderHTML += '<td><input class="button" value="Slet" onClick="deleteKursist(\\'' + kursist.id + '\\')"></td>'
                      renderHTML += '</tr>'
                    }
                  })
                renderHTML += '</table>'
                renderHTML += '<input class="button" type="submit" value="Opdater kursister">'
                renderHTML += '<div id="kursus-' + kursusID + '-response" class="success-msg"></div>'
              renderHTML += '</form>'
            renderHTML += '</div>'
          })

          // Insert renderHTML into the page
          kursisterDiv.innerHTML = renderHTML

          // Set up event listeners for kursist forms
          kurser.forEach(kursus => {
            // Create slug
            var kursusID = kursus.id
            var slug = generateSlug(JSON.parse(kursus.content).title, kursusID)
            var thisKursus = 'kursus-' + kursus.id
            document.getElementById(thisKursus).addEventListener('submit', e => {
              e.preventDefault()
              kursister.forEach(kursist => {
                if(kursist.kursus === slug) {
                  var betaltText = kursist.id + '-betalt'
                  var fakturasendtText = kursist.id + '-fakturasendt'
                  var betalt = e.target[betaltText].checked ? 1 : 0
                  var fakturasendt =  e.target[fakturasendtText].checked ? 1 : 0
                  var body = 'betalt=' + betalt + '&fakturasendt=' + fakturasendt

                  // Opdater kursist in db
                  fetch('https://api.compassionpsykologerne.dk/secure/api/kursist/' + kursist.id, {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: {
                      'Authorization': 'Basic ${AUTH_KEY}',
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body
                  })
                    .then(response => response.json())
                    .then(jsonData => {
                      if(jsonData.message === 'success') {
                        var responseDiv = document.getElementById('kursus-' + kursusID + '-response')
                        responseDiv.innerHTML = 'Kursisterne er blevet opdateret!'
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
        }

        var generateSlug = (title, id) => {
          return '/kurser/' + _.kebabCase(title) + '-' + id
        }

        var handleError = e => {
          document.getElementById('kursister').innerHTML = '<p>' + (e.error ? e.error : 'Der skete en fejl. Skriv venligst til webmasteren for at få løst dette problem') + '</p>'
        }

        var deleteKursist = id => {
          fetch('https://api.compassionpsykologerne.dk/secure/api/kursist/' + id, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
              'Authorization': 'Basic ${AUTH_KEY}',
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
            .then(response => response.json())
            .then(jsonData => {
              if(jsonData.message === 'deleted') {
                var kursistRow = document.getElementById('kursist-' + id)
                kursistRow.parentNode.removeChild(kursistRow)
              } else {
                handleError(jsonData)
              }
              return;
            })
            .catch(ex => handleError(ex))
        }

        var openKursus = (evt, tabName) => {
          evt.preventDefault()

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
      `
    }
  }

  return KursisterDirective;
};
