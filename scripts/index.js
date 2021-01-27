$(document).ready(function() {
  $('.sidenav').sidenav();
  $('.parallax').parallax();
  $('.carousel.carousel-slider').carousel({
    fullWidth: true
  });
  $('.scrollspy').scrollSpy();
  $('.collapsible').collapsible();
  makeScrollspyMove();
});

/**
 * makes it so that as you scroll down, the scrollspy side nav will
 * follow the screen downward and always be visible
 */
function makeScrollspyMove() {
  var fixmeTop = $('.table-of-contents').offset().top;
  $(window).scroll(function() {
    var currentScroll = $(window).scrollTop(),
      currentScroll = currentScroll + 20,
      actualBottom =
        $('#bodybox').offset().top + $('#bodybox').outerHeight(true),
      heightSideNav = $('.table-of-contents').outerHeight(true);
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
