(function($) {

/*------------------------------------------------------
/* 2. Add Placeholder to MailChimp
/* ---------------------------------------------------*/
	$(".mc-field-group input").attr("placeholder", "Enter your email...");


/*------------------------------------------------------
/* 3. Sidebar Fixed Scroll
/* ---------------------------------------------------*/
	$('.save-to, .share-via, .posted-under').dropit();


/*------------------------------------------------------
/* 4. Mobile Navigation
/* ---------------------------------------------------*/
	$(".navigation").append("<span class='button'>&nbsp;</span>");

	$('.navigation .button').on('click', function() {
		$(".navigation .nav").slideToggle("fast");
	});


	$('.footer-tags .wrapper-s').hideMaxListItems({
		'max': 10,
		'speed': 0,
		'moreText':'Show All ...',
		'lessText':'Show Less ...',
		'moreHTML': '<p class="maxlist-more"><a href="#"></a></p>'
	});


/*------------------------------------------------------
/* 5. Back to Top
/* ---------------------------------------------------*/
	$('.back-to-top').on('click', function (e) {
		e.preventDefault();
		$('html,body').animate({
			scrollTop: 0
		}, 700);
	});


/*------------------------------------------------------
/* 5. Back to Top
/* ---------------------------------------------------*/
	var tableColCount = $('#pagination tr:first').find('td').length;
	if (tableColCount  < 2) {  
		$(".pagination-outer").addClass("align-center");
	}

}(jQuery));