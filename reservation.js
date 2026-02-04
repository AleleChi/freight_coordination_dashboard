document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reservationForm");
  const timeInput = document.getElementById("timeSlot");
  const picker = document.getElementById("customPicker");

  const reservedSlotModal = document.getElementById("reservedSlotModal");
  const closeReservedModal = document.getElementById("closeReservedModal");
  const reservedDate = document.getElementById("reservedDate");
  const reservedTime = document.getElementById("reservedTime");
  const reservedStatus = document.getElementById("reservedStatus");

  const cancelReservationBtn = document.getElementById("cancelReservationBtn");
  const viewDetailsBtn = document.getElementById("viewDetailsBtn");

  const loadingSpinner = document.getElementById("loadingSpinner");

  let selectedDate = new Date();
  let reservedSlot = null; // Initially, no reservation made

  // Ensure calendarGrid and calendarHeader are initialized after DOM is loaded
  const calendarGrid = picker.querySelector(".calendar-grid");
  const calendarHeader = picker.querySelector(".picker-header");

  const timeBoxes = picker.querySelectorAll(".time-box");
  const ampmButtons = picker.querySelectorAll(".ampm button");

  // CALENDAR GENERATION
  function generateCalendar(date) {
    calendarGrid.innerHTML = `
      <span class="day">Su</span>
      <span class="day">Mo</span>
      <span class="day">Tu</span>
      <span class="day">We</span>
      <span class="day">Th</span>
      <span class="day">Fr</span>
      <span class="day">Sa</span>
    `;

    calendarHeader.innerHTML = `
      <span class="nav prev">←</span>
      <span class="month-year">${date.toLocaleString("default", { month: "long", year: "numeric" })}</span>
      <span class="nav next">→</span>
    `;

    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      calendarGrid.appendChild(document.createElement("span"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = day;
      btn.classList.add("date");

      if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
        btn.classList.add("selected");
      }

      calendarGrid.appendChild(btn);
    }

    attachMonthNavigation();
  }

  // MONTH NAVIGATION LOGIC
  function attachMonthNavigation() {
    const prev = calendarHeader.querySelector(".prev");
    const next = calendarHeader.querySelector(".next");

    prev.addEventListener("click", () => {
      selectedDate.setMonth(selectedDate.getMonth() - 1);
      generateCalendar(selectedDate);
    });

    next.addEventListener("click", () => {
      selectedDate.setMonth(selectedDate.getMonth() + 1);
      generateCalendar(selectedDate);
    });
  }

  generateCalendar(selectedDate);

  // TIME DISPLAY UPDATE
  function updateTimeBoxes() {
    let hours = selectedDate.getHours();
    let minutes = selectedDate.getMinutes();
    let seconds = selectedDate.getSeconds();

    const isPM = hours >= 12;
    const displayHour = hours % 12 || 12;

    timeBoxes[0].innerHTML = `${displayHour}<br /><small>hour</small>`;
    timeBoxes[1].innerHTML = `${String(minutes).padStart(2, "0")}<br /><small>min</small>`;
    timeBoxes[2].innerHTML = `${String(seconds).padStart(2, "0")}<br /><small>sec</small>`;

    ampmButtons.forEach((btn) => btn.classList.remove("active"));
    ampmButtons[isPM ? 1 : 0].classList.add("active");
  }

  updateTimeBoxes();

  // OPEN / CLOSE PICKER
  timeInput.addEventListener("click", (e) => {
    e.stopPropagation();
    picker.style.display = "flex";
  });

  picker.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", () => {
    picker.style.display = "none";
  });

  // DATE SELECTION
  picker.querySelector(".calendar-grid").addEventListener("click", (e) => {
    if (e.target.classList.contains("date")) {
      picker.querySelectorAll(".date").forEach((d) =>
        d.classList.remove("selected")
      );
      e.target.classList.add("selected");
      selectedDate.setDate(parseInt(e.target.textContent));
    }
  });

  // TIME INCREMENT
  timeBoxes[0].addEventListener("click", () => {
    selectedDate.setHours((selectedDate.getHours() + 1) % 24);
    updateTimeBoxes();
  });

  timeBoxes[1].addEventListener("click", () => {
    selectedDate.setMinutes((selectedDate.getMinutes() + 1) % 60);
    updateTimeBoxes();
  });

  timeBoxes[2].addEventListener("click", () => {
    selectedDate.setSeconds((selectedDate.getSeconds() + 1) % 60);
    updateTimeBoxes();
  });

  // AM / PM
  ampmButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let hour = selectedDate.getHours();
      const isPM = btn.textContent === "PM";

      if (isPM && hour < 12) selectedDate.setHours(hour + 12);
      if (!isPM && hour >= 12) selectedDate.setHours(hour - 12);

      updateTimeBoxes();
    });
  });

  // OK BUTTON
  picker.querySelector(".btn-primary").addEventListener("click", () => {
    const value =
      selectedDate.getFullYear() +
      "-" +
      String(selectedDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(selectedDate.getDate()).padStart(2, "0") +
      "T" +
      String(selectedDate.getHours()).padStart(2, "0") +
      ":" +
      String(selectedDate.getMinutes()).padStart(2, "0") +
      ":" +
      String(selectedDate.getSeconds()).padStart(2, "0");

    timeInput.value = value;
    picker.style.display = "none";
  });

  // CANCEL
  picker.querySelector(".btn-secondary").addEventListener("click", () => {
    picker.style.display = "none";
  });

  // FORM SUBMIT with Loading Spinner
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!timeInput.value) {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Please select a valid time slot.",
      });
      return;
    }

    // Show loading spinner
    loadingSpinner.style.display = "block";

    setTimeout(() => {
      // Store the reserved slot details
      const reservedDateValue = new Date(timeInput.value).toLocaleDateString();
      const reservedTimeValue = new Date(timeInput.value).toLocaleTimeString();

      reservedSlot = {
        date: reservedDateValue,
        time: reservedTimeValue,
        status: "Confirmed", // Status after reservation
      };

      Swal.fire({
        icon: "success",
        title: "Reservation Confirmed!",
        html: `<p>Your slot has been reserved for <b>${new Date(timeInput.value).toLocaleString()}</b></p>`,
        confirmButtonColor: "#0077cc",
      });

      // Hide loading spinner and reset form
      loadingSpinner.style.display = "none";
      form.reset();
    }, 2000); // Simulate loading time
  });

  // View Details Button
  viewDetailsBtn.addEventListener("click", () => {
    if (!reservedSlot) {
      Swal.fire({
        icon: "info",
        title: "No Reservation Found",
        text: "Please make a reservation first.",
      });
      return;
    }

    reservedDate.textContent = reservedSlot.date;
    reservedTime.textContent = reservedSlot.time;
    reservedStatus.textContent = reservedSlot.status;

    reservedSlotModal.classList.remove("hidden");
  });

  // Close Reserved Slot Modal
  closeReservedModal.addEventListener("click", () => {
    reservedSlotModal.classList.add("hidden");
  });
});
