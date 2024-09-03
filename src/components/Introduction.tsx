import React, { useEffect } from "react";
import { checkProfileSizing, getAge } from "../utility/utility";

const Introduction: React.FC = () => {
  useEffect(() => {
    $(".scrollspy").scroll();
    checkProfileSizing();
    $(window).resize(checkProfileSizing);
    $("#adalynAge").text(getAge("2/7/2012"));
    $("#blakelyAge").text(getAge("8/18/2019"));
    $("#chloeAge").text(getAge("4/6/2022"));
  }, []);

  return (
    <div id="introduction" className="section scrollspy">
      <img
        id="profilePicture"
        src="images/profileimage.jfif"
        className="circle"
      />
      <p>
        <b>Hi! My name is Trevar</b> and I am a software engineer with a strong
        passion for learning and building applications that make a difference.
        Originally from Greencastle, Indiana, I now reside in Brownsburg,
        Indiana with my wife Jessica and three children; Adalyn (
        <span id="adalynAge"></span>), Blakely (<span id="blakelyAge"></span>),
        and Chloe (<span id="chloeAge"></span>).
      </p>

      <p>
        I enjoy opportunities to lead and help others grow. By teaching others I
        am able to expand my influence beyond what a single person can
        contribute. While contributing technically with NoSQL databases,
        JavaScript development, and Pega development I have often found myself
        in positions where I am organizing and leading teams in agile adoption,
        devops practices, and automated testing initiatives.
      </p>
      <div className="parallax-container">
        <div className="parallax">
          <img src="images/IMG_4662.JPG" className="mainImage" />
        </div>
      </div>
      <h3>Hobbies/ Interests</h3>
      <ul>
        <li>
          <h4>
            <i className="material-icons">people</i> Family
          </h4>
          <p>
            My weekends are filled with family activities. I stay busy with kids
            activities, family outings, and home projects.
          </p>
        </li>
        <li>
          <h4>
            <i className="material-icons">drive_eta</i> Road Trips
          </h4>
          <p>
            Cars are a passion of mine - or more so the ability to explore and
            see where the road takes you. I like to explore new places, whether
            that means taking a different road home from work, or traveling
            hundreds of miles away to see what there is to see. If I had all of
            the time and money in the world I would probably spend a decent
            amount of that time traveling. My family enjoys to go on road trips
            when we are able.
          </p>
          <p>
            My favorite road trip we took was in 2018 when we were able to go on
            the road trip of a lifetime seeing a great amount of the western
            United States. To give an idea of what I mean when I say road trip,
            during this excursion we covered over 6000 miles in 9 days. Starting
            in Indiana, we traveled to Fort Worth, Texas for a wedding. Over the
            next week, we experienced...
            <ul>
              <li>- Off-roading in the Arizona desert</li>
              <li>- Viewing the Grand Canyon</li>
              <li>- Visiting Glenn Canyon Dam</li>
              <li>- Driving through Zion National Park</li>
              <li>
                - Tackling the blistering heat hiking at Arches National Park in
                Moab, Utah
              </li>
              <li>- Venturing through the mountains near Salt Lake City</li>
              <li>- Hiking in Grand Teton National Park</li>
              <li>- Choked on the sulfuric air at Yellowstone National Park</li>
              <li>- Drove into the clouds on Beartooth Pass</li>
              <li>- Saw 'Faces on Rocks'-Adalyn aka Mount Rushmore</li>
            </ul>
            ... and finally ending it all with a LONG drive back across the
            Dakotas and plain states to Indiana.
          </p>

          <div className="parallax-container">
            <div className="parallax">
              <img src="images/wrx.JPG" className="mainImage" />
            </div>
          </div>
          <p>
            As my youngest daughter grows older we plan to get back to our
            adventures. Our future plans are to explore the Northeastern U.S.
            since my wife (who grew up in Texas) hasn't been to many of the
            eastern states. After that, I aim to head back north to Montana
            again to soak in the mountain air, then another trip exploring the
            far west coast through California, up to Washington. At some point I
            hope to drive to Alaska, and have always had a dream of buying a car
            just to drive south as far as I could get in to south america and
            fly back home.
          </p>
        </li>
        <li>
          <h4>
            <i className="material-icons">settings</i> Mechanical Interests
          </h4>
          <p>
            I've always been very mechanically focused. I've always tinkered
            with things and grew up taking things apart and putting them back
            together to see how they work. This fueled by my love of racing
            videogames when I was younger made me in to somewhat of a gear-head.
          </p>
          <p>
            Much of my mechanical intersests are rooted when I was still pretty
            young. When I was 15, my parents got me my first car: a 2000 Chevy
            Cavalier with a cracked engine block that I started repairing as I
            looked forward to being able to drive. I purchased a totalled parts
            car with a good engine and interior, swapped the interior components
            (from a different model year) into my 2000, and swapped engines
            replacing all major seals and components. I redid the interior to be
            'cool' or as cool as I thought it was when I was 15, with speakers
            in the dash and painting interior panels. Some of these things that
            I once thought were cool, now seem somewhat juvenile, but I walked
            away with a plethora of knowledge, confidence, and value in good
            workmanship. Working on that Cavalier taught me to care for things
            even if they are small. It taught me hard work, and in general
            helped to teach me mechanical and electrical skills.
          </p>
          <p>
            {" "}
            I had strong interests in high school in aeronautical engineering
            and was planning to go to Rose Hulman or Purdue University majoring
            in aeronautical or mechanical engineering. At the time, I decided to
            pursue a secondary passion of mine: technology. I instead majored in
            computer science where I could build on my problem solving and
            tinkering attributes. While I enjoy technology and computer science,
            a personal goal of mine is to tie in my technological skills into a
            mechanical industry through embedded systems or related area of
            work.
          </p>
        </li>
      </ul>
    </div>
  );
};

export default Introduction;
