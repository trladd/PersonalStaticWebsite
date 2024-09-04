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

/**
 * makes it so that as you scroll down, the scrollspy side nav will
 * follow the screen downward and always be visible
 */
function makeScrollspyMove() {
  var fixmeTop = $(".table-of-contents").offset()?.top;
  $(window).scroll(function () {
    let currentScroll = ($(window).scrollTop() || 0) + 10;
    let actualBottom =
      // @ts-ignore
      $("#bodybox").offset().top + $("#bodybox").outerHeight(true);
    let heightSideNav = $(".table-of-contents").outerHeight(true);
    if (
      // @ts-ignore
      currentScroll >= fixmeTop &&
      // @ts-ignore
      currentScroll <= actualBottom - heightSideNav
    ) {
      $(".table-of-contents").css({
        position: "fixed",
        top: "0",
        bottom: "",
      });
    } else {
      // @ts-ignore
      if (currentScroll >= actualBottom - heightSideNav) {
        $(".table-of-contents").css({
          position: "fixed",
          bottom: "0",
          top: "",
        });
      } else {
        $(".table-of-contents").css({
          position: "static",
          bottom: "",
          top: "",
        });
      }
    }
  });
}

export { checkProfileSizing, getAge, makeScrollspyMove };
