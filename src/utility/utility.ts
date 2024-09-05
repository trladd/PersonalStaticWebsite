import exp from "constants";

/**
 * Adjusts profile picture based on window width
 */
function checkProfileSizing() {
  let width = $(window).width();
  if (width && width < 1000) {
    $("#profilePicture").css({
      width: "100px",
    });
  } else {
    $("#profilePicture").css({
      width: "200px",
    });
  }
}

function getAge(date: string) {
  let birthday: Date = new Date(date);
  let current: Date = new Date();
  let seconds: number = (current.getTime() - birthday.getTime()) / 1000;
  let minutes = seconds / 60;
  let hours = minutes / 60;
  let days = hours / 24;
  let years = days / 365;
  if (years < 1) {
    return Math.floor(days / 30.5) + " months";
  }
  return Math.floor(years);
}

export { checkProfileSizing, getAge };
