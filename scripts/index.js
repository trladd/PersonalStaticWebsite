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
});

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
