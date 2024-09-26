import exp from "constants";

/**
 * Adjusts profile picture based on window width
 */
function checkProfileSizing() {
  let width = $(window).width();
  //Change image size on hover

  if (width && width < 1000) {
    $("#profilePicture").css({
      width: "100px",
      "z-index": -1,
    });
  } else {
    $("#profilePicture").css({
      width: "200px",
      "z-index": -1,
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
