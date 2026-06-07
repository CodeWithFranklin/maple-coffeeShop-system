import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { useVerticalCarousel } from "./hooks/useVerticalCarousel";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";
import { feedBack } from "./ListItems.js";

export default function Home() {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horizontalaRef, horizontalApi] = useEmblaCarousel({ loop: true });
  const [verticalRef, verticalApi] = useEmblaCarousel(
    { axis: "y", loop: true },
    [Autoplay({ delay: 5000 })]
  );

  useEffect(() => {
    const fetchHomeItems = async () => {
      try {
        const homeQuery = query(
          collection(db, "homepage_menus"),
          orderBy("order", "asc"),
          limit(7)
        );

        const snapshot = await getDocs(homeQuery);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFeaturedItems(items);
      } catch (error) {
        console.error("Error fetching homepage items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeItems();
  }, []);
  const { selectedIndex, scrollSnaps, scrollTo } =
    useVerticalCarousel(verticalApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(horizontalApi);

  //check this out latter and fix it
  const images = ["/images/coffee.jpg", "/images/pizza.jpg"];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Brewing your experience...
      </div>
    );

  return (
    <section>
      <div className="min-h-[570px] pt-3 ">
        <section className="bg-base-100 border-secondary rounded-[2.5rem] px-10 pt-12 pb-5 max-w-screen-xl mx-auto flex flex-col gap-10 items-center justify-between shadow-sm relative overflow-hidden">
          <div className="w-full flex flex-col items-center text-center ">
            <h1 className="text-5xl md:text-7xl lg:text-[90px] font-black uppercase tracking-tight leading-[0.95] max-w-4xl mx-auto font-family relative">
              Get The Best{" "}
              <span className="absolute badge badge-accent px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider align-middle bottom-6 lg:bottom-9 -rotate-6 text-center">
                Tasty
              </span>{" "}
              Of Your Day{" "}
              <span className="badge badge-info absolute  rounded-lg text-[14px] font-black uppercase tracking-wider align-middle bottom-2 lg:top-10 left-32 -rotate-13 text-center ">
                Fresh
              </span>{" "}
              From Us
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch justify-center min-h-80">
            <div className="bg-primary/10 border-2 border-primary/20 p-6 rounded-[2.5rem] flex flex-col justify-between max-h-[255px] relative overflow-hidden shadow-sm mt-5 text-black">
              <div className="space-y-3">
                <p className="text-xl font-extrabold leading-snug">
                  Fuel your workflow. Unlimited specialty coffee, fresh
                  pastries, and high-speed workspaces built for creators.
                </p>
                <p className="text-xs font-black text-primary/60 tracking-wide uppercase">
                  save up to 20% off your first order.
                </p>
              </div>

              <button className="badge border-2 border-secondary py-[20px] font-black px-4 mt-6 bg-warning text-warning-content rounded-2xl transition-transform hover:scale-105 cursor-pointer shadow-[3px_3px_0px_0px_rgba(29,20,11,1)] w-fit">
                Our Services?
                <i className="bx bx-right-arrow-alt bx-sm"></i>
              </button>

              {/* Subtle background detail icon mimicking the line art */}
              <div className="absolute right-2 bottom-2 opacity-10 pointer-events-none">
                <i className="bx bx-cookie text-7xl"></i>
              </div>
            </div>

            {/* COLUMN 2: THE WEEKLY PICK CARD (Centered & Modified with Title Badge) */}
            <div className="bg-info font- text-white p-6 rounded-[2.9rem] relative overflow-hidden flex flex-col justify-between max-h-[255px] shadow-md ">
              <div className="lg:text-4xl text-2xl font-black uppercase tracking-tight w-[55%] mt-4">
                <p className="leading-tight">Weekly Pick!</p>
                <p className="mt-2 font-family">$13</p>
              </div>

              <img
                src="images/ad-image-2.png"
                className="w-55 absolute right-[-15px] bottom-0 object-contain pointer-events-none z-0"
                alt="bread slice asset promotion"
              />

              <button className="btn bg-warning hover:bg-warning/90 border-2 border-secondary text-warning-content font-black text-xs uppercase h-8 min-h-0 py-1 w-fit rounded-xl shadow-[2px_2px_0px_0px_rgba(29,20,11,1)]">
                Explore Menu
              </button>
            </div>

            {/* COLUMN 3: SOCIAL PROOF REVIEW BOX */}
            <div className="bg-success text-success-content max-h-[250px] overflow-hidden p-6 rounded-[2.5rem] shadow-md flex flex-col justify-between relative bg-no-repeat bg-position-[left_12rem_top_7rem] mt-7 bg-[url('/images/i-like-food.svg')] bg-size-[160px] w-90">
              <div className="avatar-group -space-x-2 w-fit mt-1">
                <div className="avatar w-9 border-0">
                  <div className="bg-neutral">
                    <img
                      src="https://img.daisyui.com/images/profile/demo/batperson@192.webp"
                      alt="Reviewer"
                    />
                  </div>
                </div>
                <div className="avatar w-9 border-0">
                  <div className="bg-neutral">
                    <img
                      src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp"
                      alt="Reviewer"
                    />
                  </div>
                </div>
                <div className="avatar w-9 border-0">
                  <div className="bg-neutral">
                    <img
                      src="https://img.daisyui.com/images/profile/demo/batperson@192.webp"
                      alt="Reviewer"
                    />
                  </div>
                </div>
                <div className="avatar avatar-placeholder w-9 border-0">
                  <div className="text-black bg-white text-[10px] font-bold">
                    <span>
                      10k<i>+</i>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[2rem] font-black uppercase tracking-tight max-w-[75%] leading-tight my-0 mb-8">
                will big foot love coffee?
              </p>

              <button className="btn h-8 min-h-0 py-1 rounded-xl border-2 border-primary btn-accent text-accent-content font-black text-xs uppercase w-fit shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                Check out
              </button>
            </div>
          </div>
        </section>
        <div className="mt-25 md:w-[85%] sm:w-[85%] lg:max-w-[80%] mx-auto px-6 sm:px-0">
          <div className="flex flex-col lg:flex-row sm:flex-row justify-between gap-x-10 sm:gap-x-5 md:gap-x-6">
            <div className="w-full sm:w-[50%] flex justify-center flex-col">
              <p className="text-4xl lg:text-5xl pb-2 lg:w-[90%] w-full font-extrabold box-decoration-clone leading-[1.2] text-black">
                Maple is so more than just coffee
                {""}
              </p>
              <p className="mb-2 text-md lg:w-[85%] w-[95%] text-gray-500">
                Have a look at some of our various services we offer, we make
                every visit count.
              </p>
            </div>
            <div className="min-h-fit sm:h-40 lg:w-[50%] sm:max-w-[50%] flex gap-y-5 lg:gap-y-0 gap-x-7 sm:gap-x-5 sm:justify-end flex-wrap items-center">
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-sky-100 text-green-900 border-0">
                Cafe
                <i className="bx bx-sm bx-coffee-togo"></i>
              </p>
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-yellow-200 text-yellow-900 border-0">
                Delivery Service
                <i className="bx bx-sm bxs-truck"></i>
              </p>
              <p className="badge bg-gray-200 font-semibold py-[16px] flex items-center rounded-4xl border-0 text-black">
                Co-work-Hub
                <i className="bx bx-sm bxs-group"></i>
              </p>
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-green-100 text-green-900 border-0">
                Library
                <i className="bx bx-sm bxs-book"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                Pastries
                <i class="bx bxs-baguette bx-sm"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl bg-lime-200 text-lime-800 border-0">
                Spa
                <i className="bx bx-sm mx-1 bxs-spa"></i>
              </p>
            </div>
          </div>
        </div>
        <div
          className="flex lg:flex-row flex-col-reverse md:flex-row md:w-[90%] lg:max-w-[80%] max-w-[95%] px-4 sm:px-6 lg:px-8 sm:ps-15 sm:items-start mx-auto mt-20 items-center 
        lg:gap-y-0 gap-y-10 lg:py-13 py-10 px-5 lg:px-0 lg:ps-10 shadow-xl rounded-4xl bg-white md:ps-0 md:ps-8 md:pe-8 md:gap-x-8"
        >
          <div className="gap-10 md:w-[45%] sm:w-[65%] lg:w-[40%]">
            {/* Carousel container */}
            <div
              className="w-full min-h-[240px] h-[270px] overflow-hidden rounded-3xl relative"
              ref={verticalRef}
            >
              {/* Slides */}
              <div className="flex flex-col h-full w-full ">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className="flex-[0_0_100%] h-full w-full relative"
                  >
                    <img
                      src={src}
                      alt=""
                      className="object-cover flex-[0_0_100%] w-full h-full rounded-4xl"
                    />
                  </div>
                ))}
              </div>

              {/* Vertical badges (like dots) */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                      index === selectedIndex ? "bg-white" : "bg-gray-400/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:w-[55%] md:w-[60%] sm:w-[85%] w-full sm:mx-0 mx-auto flex lg:justify-center">
            <div className="lg:w-[85%] ">
              <p className="text-5xl font-extrabold font-family ">
                Book your experience with us today!
              </p>
              <p className="mt-4 lg:text-[17px] w-[95%] text-md text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut
                sequi, impedit.
              </p>
              <ul className="font-semibold text-gray-600 mt-2">
                <li className="flex">
                  <i className="bx bx-badge-check me-1 mt-[5px]"></i>
                  choose from dining, workspace, lounge or spa
                </li>
                <li className="flex">
                  <i className="bx bx-badge-check me-1 mt-[5px]"></i>
                  easy online booking
                </li>
                <li className="flex">
                  <i className="bx bx-badge-check me-1 mt-[5px]"></i>
                  flexible time slots to fit your schedule
                </li>
              </ul>
              <button className="btn-warning btn rounded-4xl mt-3 border-0">
                Book a space!{" "}
                <span className="rounded-full avatar w- aspect-square flex items-center justify-center">
                  <i className="bx bx-right-arrow-alt bx-sm"></i>
                </span>
              </button>
            </div>
          </div>
        </div>
        <section className="min-h-[500px] lg:mt-25 mt-17 flex justify-center">
          <div className="flex flex-col items-center w-[90%] mx-auto lg:px-0 overflow-hidden py-10">
            <div className="lg:w-[45%] flex flex-col justify-center items-center">
              <div className="badge border-gray-200 rounded-4xl lg:font-semibold font-extrabold mb-3 lg:px-5 px-3 py-[17px]">
                <div className="text-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block h-8 w-6 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                </div>
                <div className="font-black text-gray-600">10.4K loved this</div>
              </div>
              <p className="text-5xl w-fit text-center text-black font-extrabold mt-2 font-family">
                We're cooking!
              </p>
              <p className="lg:w-150 w-[95%] md:w-[65%] sm:w-[75%] text-center mt-4 mb-3 lg:text-[20px] text-[17px] text-gray-700 ">
                We are always looking out for your tastes that's why we serve
                the tastiest of our dishes for the best prices. Breakfast, lunch
                and dinner we are always here for you.
              </p>
            </div>
            <div className="flex flex-col items-center w-full lg:px-0 mt-5 py-5">
              {/* Container for the cards */}
              <div className="flex flex-wrap justify-center gap-6">
                {featuredItems.map((menu, index) => (
                  <div
                    key={menu.id || index}
                    className="flex flex-col max-w-95 sm:p-6 p-5 rounded-4xl overflow-hidden shadow-sm bg-primary text-white w-full sm:w-[45%] lg:w-[30%] transition-transform"
                  >
                    {/* Title */}
                    <h3 className="text-3xl font-extrabold line-clamp-1 py- mb-2 font-family ">
                      {menu.name}
                    </h3>

                    {/* Content Split: Left (Text) and Right (Circle) */}
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Text Side */}
                      <div className="flex-1 flex flex-col gap-2">
                        <p className="font-black text-3xl text-accent font-family">
                          {menu.price}$
                        </p>

                        {/* Categories (Migrated from tags) */}
                        <div className="flex gap-2 flex-wrap min-h-[24px]">
                          {menu.categories?.map((cat, cIndex) => (
                            <span
                              key={cIndex}
                              className="badge font-semibold text-[11px] px-2 py-1 rounded-full bg-white/50 border-0"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        {/* Description (Migrated from about) */}
                        <p
                          className="font- text-sm line-clamp-2"
                          title={menu.description}
                        >
                          {menu.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 items-center mt-2 w-fit">
                          <button
                            onClick={() =>
                              navigate("/stores", {
                                state: {
                                  autoSearch: menu.name,
                                  productId: menu.productId || menu.id,
                                },
                              })
                            }
                            className="font-bold border-0 rounded-xl h-7 btn btn-warning transition-colors hover:cursor-point text-sm"
                          >
                            Place order
                          </button>
                          <button
                            className="px-2 py-2 flex items-center rounded-full bg-white text-black hover:bg-white/80 hover:cursor-pointer tooltip tooltip-top"
                            data-tip="view menu"
                          >
                            <i className="bx bxs-food-menu text-lg"></i>
                          </button>
                        </div>
                      </div>

                      {/* Image Side (The Circle) */}
                      <div className="w-33 h-33 md:w-37 md:h-37 flex-shrink-0 ml-auto">
                        <div className="w-full h-full aspect-square overflow-hidden rounded-full shadow-md">
                          <img
                            src={menu.img}
                            className="w-full h-full object-cover"
                            alt={menu.name}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-soft mt-12 w-fit rounded-full h-9  flex items-center gap-1 transition-transform hover:scale-105">
                Checkout maple stores{" "}
                <i className="bx bx-chevron-right text-xl"></i>
              </button>
            </div>
          </div>
        </section>
        <section className="w-[100%] lg:w-[85%] mx-auto min-h-[200px] flex flex-col lg:flex-row mt-7 lg:mt-20">
          <div className="w-full lg:w-[50%] mb-8 lg:ps-0 ps-7 sm:ps-6 ">
            <p className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl w-full text-black font-extrabold leading-[1.2]">
              loved by many!
            </p>
            <p className="mt-3 text-gray-500 w-[85%] sm:w-[48%] md:w-[48%] lg:w-[85%]">
              Our customers are our biggest fans, see what they have to say
              about us.
            </p>
          </div>

          {/* ✅ Embla carousel wrapper */}
          <div
            className="embla relative overflow-hidden w-full h-[300px]"
            ref={horizontalaRef}
          >
            {/* ✅ Embla container */}
            <div className="embla__container flex flex-nowrap gap-x-6 px-6">
              {feedBack.map((slide, index) => {
                // Explicitly define background and matching text contrast utilities
                const colors = [
                  { bg: "bg-info" },
                  { bg: "bg-success" },
                  { bg: "bg-primary/40" },
                ];

                // Cycle safely using the item's index position
                const currentTheme = colors[index % colors.length];

                return (
                  <div
                    key={slide.id}
                    className="embla__slide flex-none w-80 h-fit"
                  >
                    {/* Replaced hardcoded 'bg-info' with dynamic 'currentTheme.bg' */}
                    <div
                      className={`min-h-[210px] w-full p-5 gap-y-4 not-odd rounded-4xl flex flex-col text-black ${currentTheme.bg}`}
                    >
                      {/* Added currentTheme.text wrapper to maintain accessible contrast */}
                      <p
                        className={`text-3xl font-extrabold line-clamp-3  h-26`}
                        title={slide.review}
                      >
                        {slide.review}
                      </p>

                      <div className={`flex items-center }`}>
                        <div className="w-12 aspect-square avatar rounded-4xl bg-white"></div>
                        <div className="ms-1.5">
                          <p className="font-bold text-sm">{slide.name}</p>{" "}
                          <div className="flex gap-0.5">
                            {/* Kept star icons bright and unified across variations */}
                            <i className="bx bxs-star text-warning"></i>
                            <i className="bx bxs-star text-warning"></i>
                            <i className="bx bxs-star text-warning"></i>
                            <i className="bx bxs-star text-warning"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-8 gap-x-15">
              {/* ✅ Buttons */}
              <PrevButton
                onClick={onPrevButtonClick}
                disabled={prevBtnDisabled}
                className="touch-manipulation btn aspect-square w-10 px-0 flex justify-center items-center rounded-full cursor-pointer shadow"
              />
              <NextButton
                onClick={onNextButtonClick}
                disabled={nextBtnDisabled}
                className="touch-manipulation btn aspect-square w-10 px-0 flex justify-center items-center rounded-full cursor-pointer shadow"
              />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
