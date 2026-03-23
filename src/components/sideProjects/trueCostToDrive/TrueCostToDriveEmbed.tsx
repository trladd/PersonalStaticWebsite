import React from "react";

const TRUE_COST_TO_DRIVE_URL = "https://www.truecosttodrive.com";

function TrueCostToDriveEmbed() {
  return (
    <div className="trueCostToDriveEmbed">
      <div className="trueCostToDriveEmbed__header">
        <div className="trueCostToDriveEmbed__brandArea">
          <div className="trueCostToDriveEmbed__logoShell">
            <img
              className="trueCostToDriveEmbed__logo"
              src="/images/tctd_main_logo_cropped.png"
              alt="True Cost To Drive"
            />
          </div>
          <div className="trueCostToDriveEmbed__intro">
            <h1 className="trueCostToDriveEmbed__title">TrueCostToDrive.com</h1>
            <p className="trueCostToDriveEmbed__copy">
              A focused home for understanding what vehicle ownership really
              costs, beyond just the gas pump.
            </p>
            <p className="trueCostToDriveEmbed__stack">
              Current stack: React, TypeScript, MUI, Redux, IndexedDB
            </p>
          </div>
        </div>

        <a
          className="waves-effect waves-light btn trueCostToDriveEmbed__button"
          href={TRUE_COST_TO_DRIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="material-icons left">open_in_new</i>
          Take me to the site
        </a>
      </div>

      <details className="trueCostToDriveEmbed__accordion">
        <summary className="trueCostToDriveEmbed__accordionSummary">
          Click to learn about my motivation behind this project
        </summary>
        <div className="trueCostToDriveEmbed__accordionBody">
          <h2>The background</h2>
          <p>
            True Cost To Drive started from a simple frustration: most people
            can roughly tell you what they spend on gas, but very few have a
            clear picture of what a vehicle is actually doing to their budget
            over time. Some time around 2019, I was looking to make some extra
            cash and decided I would try uber. After a few trips I broke down
            how much it was really costing me. Not just gas, but oil, tires, and
            more. While I had to come up with the numbers on my own of course, I
            was surprised that no one has a tool to do this. I couldn't find a
            shared spreadsheet, website, or any source that would get me where I
            was wanting.
          </p>
          <p>
            More time went by - and I would see posts from others, or
            conversations about others working in gig services like food
            delivery and amazon delivery. I would see vehicles showing up at my
            house for those services and I would notice sometimes luxury SUVs
            delivering food. While anyone can make their own decisions and
            everyone is in a unique financial scenario - the big picture can
            sometimes point out that a short term gain is not advantageous in
            the long run.
          </p>
          <p>
            When I calculated my income from ubering, it was low. I don't
            remember the final number, but after I factored in my WRX's
            expensive high tread wear tires, and the fancy oil that I chose to
            use, along with the increased risk of being out, and some minor
            damage to a door from a rider after only a few days - I decided that
            in my WRX, it just was not worth it. While a WRX is not the choice
            of anyone looking to save a buck, and more so an enthusiast vehicle,
            it's also not the most expensive thing on the road by any means.
            That lead me to really question which models ARE suitable for a
            decent income for gig workers.
          </p>
          <p>
            It led me to wonder if some gig workers are really considering the
            long run or instead hitting a barrier after years of work seeing a
            depreciated vehicle, a need for a new vehicle, and no budget to
            stretch...
          </p>
          <h2>The solution</h2>
          <p>
            I wanted to build something that treats a car like a real financial
            decision, not just a machine with an MPG number. That means bringing
            together depreciation, insurance, maintenance, parking, financing,
            and trip planning into one clearer experience.
          </p>
          <p>
            I started in 2026 after having a near empty code file that was
            started years ago. I wondered, with AI (Codex), could I leverage a
            small portion of my time outside of work to build this tool finally?
            After all what I wanted to build would just be too time consumming
            for what I was willing to put in. Sure enough after a couple hours
            with Codex, I was off to the races. I built a pretty suitable tool
            in my trevarladd.com site. That is the "Car Cost Calculator". But
            that side project on a portfolio site isn't going to really help the
            general public. That's where I decided to stand up{" "}
            <a href="https://truecosttodrive.com">TrueCostToDrive.com</a>. A
            place where I could expand to multiple vehicles and a larger
            audience.
          </p>
          <p>
            I&apos;ll keep expanding this section with more of the story,
            tradeoffs, and lessons learned as the project grows.
          </p>
        </div>
      </details>

      <div className="trueCostToDriveEmbed__frameShell">
        <iframe
          className="trueCostToDriveEmbed__frame"
          src={TRUE_COST_TO_DRIVE_URL}
          title="True Cost To Drive"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

export default TrueCostToDriveEmbed;
