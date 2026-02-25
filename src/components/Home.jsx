import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { useVerticalCarousel } from "./hooks/useVerticalCarousel";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";
import { menuList, feedBack } from "./ListItems.js";

export default function Home() {
  const [horizontalaRef, horizontalApi] = useEmblaCarousel({ loop: true });
  const [verticalRef, verticalApi] = useEmblaCarousel(
    { axis: "y", loop: true },
    [Autoplay({ delay: 5000 })]
  );

  // Pass emblaApi to the vertical carousel hook
  const { selectedIndex, scrollSnaps, scrollTo } =
    useVerticalCarousel(verticalApi);

  // Pass emblaApi to the prev/next hook for controls
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(horizontalApi);

  //check this out latter and fix it
  const images = ["/images/coffee.jpg", "/images/pizza.jpg"];

  return (
    <section>
      <div className="min-h-[570px] pt-7 sm:pt-10">
        <section className="flex flex-col lg:flex-row sm:ps-10 lg:justify-between max-w-screen-xl mx-auto px-5 gap-y-10">
          <div className="min-h-full lg:w-fit">
            <div className="lg:w-150 sm:w-150 w-full">
              <p className="lg:text-[100px] text-5xl md:text-6xl font-extrabold box-decoration-clone leading-[1.2] ">
                Get the best of your day from us!
              </p>
              <div className="lg:w-[92%] w-[92%] text-gray-500">
                <p className="text-xl mt-6 font-semibold sm:w-[80%] lg:w-full ">
                  The flavour, the comfort, the moments that you deserve. <br />
                </p>
                <p className="">save up to 20% off your first order.</p>
              </div>

              <div className="badge badge-soft border-0 py-[23px] pe-0 font-semibold px-5 mt-6 bg-lime-300 rounded-3xl">
                <a href="">
                  Our Services?
                  <span className="avatar rounded-full aspect-square bg-blue-40 ms-2 min-w-9 justify-center items-center">
                    <i className="bx bx-right-top-arrow-circle bx-lg"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-7 md:gap-x-15 lg:gap-x-0 w-full lg:items-end">
            <div className="bg-blue-300 max-w-85 sm:w-80 flex-1 flex-wrap lg:w-full min-h-[230px] lg:min-h-[250px] rounded-4xl relative ps-5 overflow-hidden flex flex-col justify-center">
              <div className="lg:text-4xl text-3xl font-extrabold w-[45%]">
                <p className="text-white">weekly pick!</p>
                <p className="text-yellow-400 mt-2">13$</p>
              </div>

              <img
                src="/images/ad-image-2.png"
                className="lg:w-55 w-52 absolute right-[-10px] bottom-0 "
                alt="bread"
              />

              <div className="flex gap-x-1 items-center mt-3 w-fit">
                <button className="mt-2 font-bold border-0 btn h-7 rounded-2xl gap-x-1">
                  Explore
                </button>
                <button
                  className="btn rounded-full border-0 text-center mt-2 pt-1 w-10 aspect-square tooltip tooltip-top bg-lime-300"
                  data-tip="add to cart"
                >
                  <i className="bx bx-heart bx-sm"></i>
                </button>
              </div>
            </div>

            <div className="bg-purple-300 min-h-[230px] lg:min-h-[250px] overflow-hidden max-w-85 sm:w-80 flex-1 lg:w-full self-end pt-5 ps-5 bg-[url('/images/i-like-food.svg')] bg-size-[160px] lg:bg-size-[185px] bg-no-repeat bg-position-[right_0_top_7rem]">
              <div className="avatar-group -space-x-2 lg:h-9 h-8 lg:w-fit w-26 mt-1 float-right me-3">
                <div className="avatar w-9 border-1">
                  <div>
                    <img src="https://img.daisyui.com/images/profile/demo/batperson@192.webp" />
                  </div>
                </div>
                <div className="avatar w-9 border-1">
                  <div>
                    <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" />
                  </div>
                </div>
                <div className="avatar w-9 border-1">
                  <div>
                    <img src="https://img.daisyui.com/images/profile/demo/averagebulk@192.webp" />
                  </div>
                </div>
                <div className="avatar avatar-placeholder w-9 border-1">
                  <div className="text-black bg-white text-xs font-bold">
                    <span>
                      10k<i className="text-orange-400">+</i>
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-4xl lg:text-[40px] font-extrabold max-w-[70%] leading-[1.2] line-clamp-3 h-36 sm:h-34 md:h-36 mb-4">
                <span className="text-lime-200">"</span>will big foot love
                coffee?<span className="text-lime-200">"</span>
              </p>
              <button className="btn h-8 rounded-xl mt-0 lg:mt-2 border-0 bg-orange-200 ">
                Check out
              </button>
            </div>
          </div>
        </section>
        <section className="mt-25 md:w-[85%] sm:w-[85%] lg:max-w-[80%] mx-auto px-6 sm:px-0">
          <div className="flex flex-col lg:flex-row sm:flex-row justify-between gap-x-10 sm:gap-x-5 md:gap-x-6">
            <div className="w-full sm:w-[50%] flex justify-center flex-col">
              <p className="text-4xl lg:text-5xl pb-2 lg:w-[90%] w-full font-extrabold box-decoration-clone leading-[1.2]">
                Maple is so more than just coffee{""}
              </p>
              <p className="mt-2 mb-2 text-md lg:text-[18px] lg:w-[85%] w-[95%] text-gray-500">
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
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl border-0">
                Co-work-Hub
                <i className="bx bx-sm bxs-group"></i>
              </p>
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-green-100 text-green-900 border-0">
                Library
                <i className="bx bx-sm bxs-book"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                Lounge
                <i className="bx bx-sm bxs-drink"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl bg-lime-200 text-lime-900 border-0">
                Spa
                <i className="bx bx-sm mx-1 bxs-spa"></i>
              </p>
            </div>
          </div>
        </section>
        <section
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
              <p className="text-4xl font-extrabold ">
                Book your experience with us today!
              </p>
              <p className="mt-4 lg:text-[17px] w-[95%] text-md text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut
                sequi, impedit.
              </p>
              <ul className="font-semibold text-gray-600 mt-2">
                <li className="flex">
                  <i className="bx bx-badge-check me-1 mt-[5px] text-yellow-400"></i>
                  choose from dining, workspace, lounge or spa
                </li>
                <li className="flex">
                  <i className="bx bx-badge-check me-1 mt-[5px] text-yellow-400"></i>
                  easy online booking
                </li>
                <li className="flex">
                  <i className="bx bx-badge-check me-1 mt-[5px] text-yellow-400"></i>
                  flexible time slots to fit your schedule
                </li>
              </ul>
              <button className="bg-lime-300 btn rounded-4xl pe-1 mt-3 border-0">
                Book a space!{" "}
                <span className="bg-black rounded-full avatar w-8 aspect-square flex items-center justify-center">
                  <i className="bx bx-right-arrow-alt bx-sm text-white"></i>
                </span>
              </button>
            </div>
          </div>
        </section>
        <section className="min-h-[500px] lg:mt-25 mt-17 flex justify-center">
          <div className="min-h- flex flex-col items-center w-[90%] mx-auto lg:px-0 overflow-hidden py-10">
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
              <p className="text-4xl w-fit text-center font-extrabold mt-2">
                We're cooking!
              </p>
              <p className="lg:w-150 w-[95%] md:w-[65%] sm:w-[75%] text-center mt-4 mb-3 lg:text-[20px] text-[17px] font-light lg:font-extralight text-gray-700">
                We are always looking out for your tastes that's why we serve
                the tastiest of our dishes for the best prices. Breakfast, lunch
                and dinner we are always here for you.
              </p>
            </div>
            <div className="flex flex-col items-center w-full lg:px-0 mt-5 py-5">
              {/* Container for the cards */}
              <div className="flex flex-wrap justify-center gap-6">
                {menuList.map((menu, index) => (
                  <div
                    key={index}
                    className="flex flex-col max-w-95 sm:p-6 p-5 rounded-3xl bg-blue-200 overflow-hidden shadow-sm"
                  >
                    {/* Title */}
                    <h3 className="text-3xl font-extrabold line-clamp-1 mb-2">
                      {menu.name}
                    </h3>

                    {/* Content Split: Left (Text) and Right (Circle) */}
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Text Side */}
                      <div className="flex-1 flex flex-col gap-2">
                        <p className="font-black text-lime-600 text-3xl">
                          {menu.price}$
                        </p>

                        {/* Tags */}
                        <div className="flex gap-2 flex-wrap min-h-[24px]">
                          {menu.tags.map((tag, tIndex) => (
                            <span
                              key={tIndex}
                              className="badge font-semibold text-[11px] px-2 py-1 rounded-full bg-white/50 border-0"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Description */}
                        <p
                          className="font-light text-sm line-clamp-2"
                          title={menu.about}
                        >
                          {menu.about}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 items-center mt-2 w-fit">
                          <button className="font-bold border-0 badge py-4 rounded-xl bg-lime-300 hover:bg-lime-400 transition-colors hover:cursor-pointer text-sm">
                            Place order
                          </button>
                          <button
                            className="px-2 py-2 flex items-center rounded-full bg-white/40 hover:bg-white/60  hover:cursor-pointer tooltip tooltip-top"
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

              <button className="btn btn-primary mt-12 w-fit rounded-full h-9 text-warning flex items-center gap-1 transition-transform hover:scale-105">
                View more <i className="bx bx-chevron-right text-xl"></i>
              </button>
            </div>
          </div>
        </section>
        <section className="w-[100%] lg:w-[85%] mx-auto min-h-[200px] flex flex-col lg:flex-row mt-7 lg:mt-20">
          <div className="w-full lg:w-[50%] mb-8 lg:ps-0 ps-7 sm:ps-6 ">
            <p className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl w-full pe- font-extrabold leading-[1.2]">
              loved by many! 🤩
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
              {feedBack.map((slide) => (
                <div
                  key={slide.id}
                  className="embla__slide flex-none w-80 h-fit"
                >
                  <div className="min-h-[210px] w-full p-5 gap-y-4 not-odd rounded-4xl flex flex-col bg-blue-300 bg-[url('/images/wiggle.svg')] bg-no-repeat bg-size-[auto_100px]">
                    <p
                      className="text-3xl text-gray-800 font-extrabold line-clamp-3 h-26"
                      title={slide.review}
                    >
                      {slide.review}
                    </p>
                    <div className="flex items-center ">
                      <div className="w-12 aspect-square avatar rounded-4xl bg-primary"></div>
                      <div className="ms-1.5">
                        <p className="font-bold text-sm">{slide.name}</p>{" "}
                        <div>
                          <i className="bx bxs-star text-warning"></i>
                          <i className="bx bxs-star text-warning"></i>
                          <i className="bx bxs-star text-warning"></i>
                          <i className="bx bxs-star text-warning"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
