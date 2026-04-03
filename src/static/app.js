document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;


        const participantsHtml = details.participants.length
          ? `<div class="participants-list">${details.participants
              .map((p) => `
                <span class="participant-item">
                  <span class="participant-email">${p}</span>
                  <span class="delete-participant" title="Remove" data-activity="${name}" data-email="${p}">&times;</span>
                </span>`)
              .join("")}</div>`
          : `<p class="no-participants">No participants yet</p>`;


        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        // Event delegation per delete icon
        activityCard.addEventListener("click", async (e) => {
          if (e.target.classList.contains("delete-participant")) {
            const email = e.target.getAttribute("data-email");
            const activityName = e.target.getAttribute("data-activity");
            if (confirm(`Remove ${email} from ${activityName}?`)) {
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`, {
                  method: "DELETE"
                });
                if (resp.status === 204) {
                  fetchActivities();
                } else {
                  const err = await resp.json();
                  alert(err.detail || "Failed to remove participant");
                }
              } catch (err) {
                alert("Network error");
              }
            }
          }
        });
                  // Svuota il select prima di popolarlo
                  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

                  // Popola la lista delle attività
                  Object.entries(activities).forEach(([name, details]) => {
                    const activityCard = document.createElement("div");
                    activityCard.className = "activity-card";

                    const spotsLeft = details.max_participants - details.participants.length;

                    const participantsHtml = details.participants.length
                      ? `<div class="participants-list">${details.participants
                          .map((p) => `
                            <span class="participant-item">
                              <span class="participant-email">${p}</span>
                              <span class="delete-participant" title="Remove" data-activity="${name}" data-email="${p}">&times;</span>
                            </span>`)
                          .join("")}</div>`
                      : `<p class="no-participants">No participants yet</p>`;

                    activityCard.innerHTML = `
                      <h4>${name}</h4>
                      <p>${details.description}</p>
                      <p><strong>Schedule:</strong> ${details.schedule}</p>
                      <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
                      <div class="participants">
                        <h5>Participants</h5>
                        ${participantsHtml}
                      </div>
                    `;

                    activitiesList.appendChild(activityCard);

                    // Aggiungi opzione al select
                    const option = document.createElement("option");
                    option.value = name;
                    option.textContent = name;
                    activitySelect.appendChild(option);
                  });
      );

      const result = await response.json();

        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          signupForm.reset();
          fetchActivities(); // aggiorna la lista dopo iscrizione
        } else {
          messageDiv.textContent = result.detail || "An error occurred";
          messageDiv.className = "error";
        }

        messageDiv.classList.remove("hidden");

        // Hide message after 5 seconds
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
