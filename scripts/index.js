$(document).ready(function() {
  checkProfileSizing();
  $('.sidenav').sidenav();
  $('.parallax').parallax();
  $('.carousel-slider').carousel({
    fullWidth: true
  });
  $('.scrollspy').scrollSpy();
  $('.collapsible').collapsible();
  makeScrollspyMove();
  $(window).resize(checkProfileSizing);
  $("#adalynAge").text(getAge('2/7/2012'));
  $("#blakelyAge").text(getAge('8/18/2019'))
  $("#chloeAge").text(getAge('4/6/2022'))
});

/**
 * Adjusts profile picture based on window width
 */
function checkProfileSizing() {
  let width = $(window).width();
  if (width < 1000) {
    $('#profilePicture').css({
      width: '100px'
    });
  } else {
    $('#profilePicture').css({
      width: '200px'
    });
  }
}

function getAge(date){
  let birthday = new Date(date);
  let current = new Date();
  let seconds =  (current-birthday)/1000;
  let minutes = seconds/60;
  let hours = minutes/60;
  let days = hours/24;
  let years = days/365;
  if(years < 1){
    return  Math.floor(days/30.5) + " months"
  }
  return Math.floor(years);
}

/**
 * makes it so that as you scroll down, the scrollspy side nav will
 * follow the screen downward and always be visible
 */
function makeScrollspyMove() {
  var fixmeTop = $('.table-of-contents').offset().top;
  $(window).scroll(function() {
    let currentScroll = $(window).scrollTop() + 10;
    let actualBottom =
      $('#bodybox').offset().top + $('#bodybox').outerHeight(true);
    let heightSideNav = $('.table-of-contents').outerHeight(true);
    if (
      currentScroll >= fixmeTop &&
      currentScroll <= actualBottom - heightSideNav
    ) {
      $('.table-of-contents').css({
        position: 'fixed',
        top: '0',
        bottom: ''
      });
    } else {
      if (currentScroll >= actualBottom - heightSideNav) {
        $('.table-of-contents').css({
          position: 'fixed',
          bottom: '0',
          top: ''
        });
      } else {
        $('.table-of-contents').css({
          position: 'static',
          bottom: '',
          top: ''
        });
      }
    }
  });
}
