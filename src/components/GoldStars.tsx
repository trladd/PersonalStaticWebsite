import React from "react";

interface GoldStarsProps {
  stars: number;
  scale?: 5 | 10;
  showEmptyStars?: boolean;
}

const GoldStars: React.FC<GoldStarsProps> = ({
  stars,
  scale = 10,
  showEmptyStars = true,
}) => {
  const starList = () => {
    //will always show five icons star, star_half, star_border
    //if scale is 10, it may show star_half, otherwise always full star
    let starList = [];
    for (let i = 0; i < scale; i++) {
      if (i < stars) {
        starList.push(<i className="material-icons">star</i>);
      } else if (i === stars && scale === 10) {
        starList.push(<i className="material-icons">star_half</i>);
      } else if (showEmptyStars) {
        starList.push(<i className="material-icons">star_border</i>);
      }
    }
    return starList;
  };

  return <span className="goldStars">{starList()}</span>;
};

export default GoldStars;
