import React, { useEffect } from "react";
import { checkProfileSizing, getAge } from "../utility/utility";
import M from "materialize-css"; // Import the necessary library
import RoadTripSnapshotLoader from "./sideProjects/roadTrips/RoadTripSnapshotLoader";

const Introduction: React.FC = () => {
  useEffect(() => {
    $(".scrollspy").scroll();
    checkProfileSizing();
    $(window).resize(checkProfileSizing);
    $("#adalynAge").text(getAge("2/7/2012"));
    $("#blakelyAge").text(getAge("8/18/2019"));
    $("#chloeAge").text(getAge("4/6/2022"));
    M.Materialbox.init(document.querySelectorAll(".materialboxed"), {});
  }, []);

  return (
    <>
      <div id="introduction" className="section scrollspy">
        <img
          id="profilePicture"
          src="images/profileimage.jfif"
          className="circle"
          alt="Trevar Ladd portrait"
        />
        <p>
          <b>Hi! My name is Trevar</b>, a software engineer with a passion for
          creating impactful applications and continuously expanding my skill
          set. I’m originally from Greencastle, Indiana, and now live in
          Brownsburg with my wife Jessica and our three children: Adalyn (
          <span id="adalynAge"></span>), Blakely (<span id="blakelyAge"></span>
          ), and Chloe (<span id="chloeAge"></span>).
        </p>
        <p>
          I’m driven by the belief that leadership is about empowering others.
          Through teaching and mentorship, I amplify the value I bring to teams,
          fostering growth beyond individual contributions. I specialize in
          NoSQL databases, full stack JavaScript development, and have a very
          deep knowledge of Pega, and have led initiatives in agile adoption,
          DevOps, and automated testing. These experiences have honed my skills
          in both technical problem-solving and team organization, allowing me
          to lead with a balance of strategy and hands-on execution.
        </p>
      </div>
      <div className="divider"></div>
      <div id="hobbies" className="section scrollspy">
        <h3>Hobbies/ Interests</h3>
        <ul>
          <li>
            <h4>
              <i className="material-icons">people</i> Family
            </h4>
            <p>
              My weekends are filled with family activities. I stay busy with
              kids activities, family outings, and home projects. Of course
              having a busy house with three kids, there is always some house
              work that needs caught up over the weekends. Aside from the
              typical suburban dad activities and maintaining the house, I like
              watching movies with the kids, going on walks around our
              neighborhood, and going to various sporting events.
            </p>
          </li>
          <li>
            <h4>
              <i className="material-icons">drive_eta</i> Road Trips
            </h4>
            <p>
              Cars are a passion of mine - or more so the ability to explore and
              see where the road takes you. I like to explore new places,
              whether that means taking a different road home from work, or
              traveling hundreds of miles away to see what there is to see. If I
              had all of the time and money in the world I would probably spend
              a decent amount of that time traveling. My family enjoys to go on
              road trips when we are able.
            </p>
            <p>
              My favorite road trip we took was in 2018 when we were able to go
              on the road trip of a lifetime seeing a great amount of the
              western United States. To give an idea of what I mean when I say
              road trip, during this excursion we covered over 6000 miles in 9
              days. Starting in Indiana, we traveled to Fort Worth, Texas for a
              wedding. Over the next week, we experienced...
              <ul>
                <li>- Off-roading in the Arizona desert</li>
                <li>- Viewing the Grand Canyon</li>
                <li>- Visiting Glenn Canyon Dam</li>
                <li>- Driving through Zion National Park</li>
                <li>
                  - Tackling the blistering heat hiking at Arches National Park
                  in Moab, Utah
                </li>
                <li>- Venturing through the mountains near Salt Lake City</li>
                <li>- Hiking in Grand Teton National Park</li>
                <li>
                  - Choked on the sulfuric air at Yellowstone National Park
                </li>
                <li>- Drove into the clouds on Beartooth Pass</li>
                <li>- Saw 'Faces on Rocks'-Adalyn aka Mount Rushmore</li>
              </ul>
              ... and finally ending it all with a LONG drive back across the
              Dakotas and plain states to Indiana.
            </p>

            <img
              className="materialboxed responsive-img mainImage"
              src="images/wrx.JPG"
              alt="Trevar's Subaru WRX on a road trip"
            />
            <p>
              Below you can see a map of various road trips I've gone on, and
              some that I would really like to do. The blue line represents that
              awesome 2018 trip.
            </p>

            <RoadTripSnapshotLoader
              className="roadTrips--embedded"
              compactSummary
              mapFirst
              showHero={false}
              showHeader={false}
              showBreakdowns={false}
              showFilter={false}
              showHint={false}
            />

            <div className="roadTrips__embedCallout card-panel">
              <p className="roadTrips__embedCalloutCopy">
                If you want to build a map like this for yourself, build it
                here.
              </p>
              <a
                className="roadTrips__embedCalloutLink"
                href="/sideProjects/roadTrips"
              >
                Open the Road Trip Atlas builder
              </a>
            </div>

            <p>
              As my youngest daughter grows older I would like to get back to
              our adventures. Our future plans are to explore the Northeastern
              U.S. since my wife (who grew up in Texas) hasn't been to many of
              the eastern states. After that, I aim to head back north to
              Montana again to soak in the mountain air, then another trip
              exploring the far west coast through California, up to Washington.
              At some point I hope to drive to Alaska, and have always had a
              dream of buying a cheap car just to drive south as far as I could
              get in central america, sell the car, and fly back home.
            </p>
          </li>
          <li>
            <h4>
              <i className="material-icons">settings</i> Mechanical Interests
            </h4>
            <p>
              {" "}
              I’ve always been mechanically inclined, constantly tinkering and
              taking things apart to understand how they work. Growing up, my
              love for racing video games only deepened my interest in cars,
              turning me into a bit of a gearhead.
            </p>
            <p>
              My passion for mechanics really took off at 15 when my parents
              gave me my first car: a 2000 Chevy Cavalier with a cracked engine
              block. Eager to drive, I took on the challenge of repairing it. I
              bought a totaled parts car with a good engine and interior, and
              from there, I swapped engines, replaced seals and major
              components, and even installed interior parts from a different
              model year. I also customized the interior with new speakers and
              painted panels—what I thought was ‘cool’ at the time. Though some
              of my design choices now seem a bit juvenile, the experience was
              invaluable.
            </p>
            <p>
              That Cavalier taught me the importance of hard work, attention to
              detail, and the pride that comes from doing things right. It gave
              me hands-on experience with mechanical and electrical systems, and
              more importantly, it instilled in me a lifelong appreciation for
              quality workmanship, no matter the scale of the project.
            </p>
            <p>
              The Cavalier was just the start of my journey toward mechanical
              independence. Throughout my childhood, I worked alongside my dad
              on cars and other equipment, and I owe much of my mechanical
              expertise to those early experiences with him. Because of this
              basic mentality that anything can be fixed, that replacing valves
              on an old engine is nearly basic maintanence, I was ingrained with
              the idea that the world around me was complex, but understandable.
            </p>
            <p>
              My next vehicle spun a bearing at 230,000 miles. With limited
              funds, I took on the challenge of rebuilding the motor instead of
              opting for another engine swap. This rebuild was far more
              intricate, and I learned even more through the process. By now,
              I’ve developed a deep understanding of nearly every aspect of
              mechanical systems in cars and other equipment, allowing me to
              confidently diagnose issues and make effective, long-lasting
              repairs.
            </p>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Introduction;
