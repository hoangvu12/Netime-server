import axios from "axios";
import cheerio from "cheerio";
import { serialize } from "../utils/index";

const client = axios.create({
  baseURL: "http://animevietsub.tv",
});

const COMPLETED_TEXT = "HOÀNTẤT";

export interface getListData {
  slug: string;
  page: number;
}

export const getList = async (slug: string = "anime-moi", page: number = 1) => {
  const { data } = await client.get(`/${slug}/trang-${page}.html`);

  const $ = cheerio.load(data);

  const totalPage = $(".wp-pagenavi .pages")
    .first()
    .text()
    .trim()
    .split("của ")[1];
  const currentPage = $(".wp-pagenavi .current").first().text().trim();

  const pagination = {
    totalPage: Number(totalPage),
    currentPage: Number(currentPage),
  };

  return {
    data: parseList($(".MovieList.Rows").html()!),
    pagination,
  };
};

export const getSlide = async () => {
  const { data } = await client.get("/");

  const $ = cheerio.load(data);

  return $(".MovieListSldCn .TPostMv")
    .toArray()
    .map((e) => {
      const item = $(e);

      const url = item.find("a").attr("href");

      const image = item.find("img").attr("src");
      const title = item.find(".Title").text().trim();
      const stars = item.find(".Vote").text().trim();
      const time = item.find(".Time").text().trim();
      const date = item.find(".Date").text().trim();
      const quality = item.find(".Qlty").text().trim();
      const description = item
        .find(".Description p:not([class])")
        .text()
        .trim();
      const studio = item.find(".Studio").text().trim().replace("Studio: ", "");
      const genres = parseInfoList(item.find(".Genre").html()!);

      const slug = urlToSlug(url!);

      return {
        image,
        slug,
        title,
        stars: Number(stars),
        time,
        date,
        quality,
        description,
        studio,
        genres,
      };
    });
};

export const getWatchInfo = async (slug: string) => {
  const { data } = await client.get(`/phim/${slug}/xem-phim.html`);
  const $ = cheerio.load(data);

  const filmIdRegex = /filmInfo.filmID = parseInt\('(.*?)'\)/g;
  const [_, id] = filmIdRegex.exec(data)!;

  const episodes = $(".list-episode li a")
    .toArray()
    .map((e) => {
      const episode = $(e);

      const id = episode.data("id");
      const hash = episode.data("hash");
      const name = episode.text().trim()

      return { id, hash, name };
    });
  const title = $(".Title").first().text().trim();
  const description = $(".Description").first().text().trim();

  return {
    id: Number(id),
    episodes,
    title,
    description,
  };
};

export const getSource = async (hash: string, filmId: number) => {
  const { data } = await client.post(
    "/ajax/player?v=2019a",
    serialize({
      link: hash,
      id: filmId,
    })
  );

  const returnObj = {
    source: "",
    type: "",
  };

  if (data.playTech == "api" || data.playTech == "all") {
    if (typeof data.link === "string") {
      returnObj.source = data.link;
    } else {
      returnObj.source = data.link[0].file;
    }
    returnObj.type = "hls";
  } else {
    returnObj.type = "mp4";
    returnObj.source = data.link;
  }

  return returnObj;
};

export const getInfo = async (slug: string) => {
  const { data } = await client.get(`/phim/${slug}/`);

  const $ = cheerio.load(data);

  const getInfoElement = (name: string) => {
    const li = $(`.InfoList .AAIco-adjust strong:contains("${name}")`).closest(
      "li"
    );

    li.find("strong").remove();

    return li;
  };

  const backgroundImage = $("img.TPostBg").attr("src");
  const title = $(".TPost.Single .Title").text().trim();
  const altTitle = $(".SubTitle").text().trim();
  const image = $(".Image img").attr("src");
  const description = $(".Description").text().trim();
  const time = $(".TPost.Single .Time").text().trim();
  const date = $(".TPost.Single .Date").text().trim();
  const views = $(".TPost.Single .View").text().trim();

  const relatedParts = $(".season_item a")
    .toArray()
    .map((e) => {
      const season = $(e);

      const slug = urlToSlug(season.attr("href")!);
      const name = season.text().trim();
      const altName = season.attr("title");

      return { slug, name, altName };
    });

  const latestEpisodes = $(".latest_eps a")
    .toArray()
    .map((e) => {
      const episode = $(e);

      const slug = urlToSlug(episode.attr("href")!);
      const name = episode.text().trim();
      const altName = episode.attr("title");

      return { slug, name, altName };
    });

  const status = getInfoElement("Trạng thái").text().trim();
  const showtime = getInfoElement("Lịch chiếu").text().trim();
  const followers = getInfoElement("Số người theo dõi").text().trim();
  const quality = getInfoElement("Chất lượng").text().trim();
  const rating = getInfoElement("Rating").text().trim();
  const language = getInfoElement("Ngôn ngữ").text().trim();
  const studio = getInfoElement("Studio").text().trim();
  const genres = parseInfoList(getInfoElement("Thể loại").html()!);
  const directors = parseInfoList(getInfoElement("Đạo diễn").html()!);
  const nations = parseInfoList(getInfoElement("Quốc gia").html()!);
  const seasons = getInfoElement("Season")
    .find("a")
    .toArray()
    .map((e) => {
      const genre = $(e);
      const name = genre.text().trim();
      const parts = genre.attr("href")?.split("season/");

      const slug = parts?.[1].replace(new RegExp("/" + "$"), "");

      return { name, slug };
    });

  const relatedAnime = parseList($(".MovieListRelated").html()!);

  return {
    backgroundImage,
    title,
    altTitle,
    image,
    description,
    time,
    date,
    views,
    latestEpisodes,
    status,
    showtime,
    followers,
    quality,
    rating,
    language,
    studio,
    genres,
    directors,
    nations,
    seasons,
    relatedAnime,
    relatedParts,
  };
};

function parseInfoList(html: string | undefined) {
  if (!html) return null;

  const $ = cheerio.load(html);

  const list = $("a")
    .toArray()
    .map((e) => {
      const genre = $(e);
      const name = genre.text().trim();
      const slug = urlToSlug(genre.attr("href")!);

      if (!name && !slug) return false;

      return { name, slug };
    })
    .filter((a) => a);

  return list.length > 0 ? list : [];
}

function parseList(html: string) {
  const $ = cheerio.load(html);

  $.prototype.exists = function (selector: string) {
    return this.find(selector).length > 0;
  };

  return $(".TPostMv")
    .toArray()
    .map((e) => {
      const item = $(e);

      const url = item.find("a").attr("href");

      const image = item.find("img").attr("src");
      const title = item.find(".Title").first().text().trim();
      const slug = urlToSlug(url!);
      const views = item.find(".Year").text().trim().replace("Lượt xem: ", "");
      const stars = item.find(".anime-avg-user-rating").text().trim();
      const quality = item.find(".Qlty").text().trim();
      const time = item.find(".Time").text().trim();
      const date = item.find(".Date").text().trim();
      const description = item
        .find(".Description p:not([class])")
        .text()
        .trim();
      const studio = item
        .find(".Director")
        .text()
        .trim()
        .replace("Studio: ", "");
      const genres = parseInfoList(item.find(".Genre").html()!);

      const isCompleted =
        item.find(".mli-eps").text().trim() === COMPLETED_TEXT;
      const isUpcoming = item.exists(".mli-timeschedule");

      const currentEpisode = item.find(".mli-eps i").text().trim();

      return {
        stars: Number(stars),
        image,
        title,
        slug,
        views: !views ? null : Number(views.replace(/,/g, "")),
        isCompleted,
        isUpcoming,
        upcomingYear: isUpcoming ? item.find(".b").text().trim() : null,
        totalEpisodes:
          !isUpcoming && !isCompleted && currentEpisode
            ? Number(currentEpisode)
            : null,
        quality,
        date,
        time,
        description,
        studio,
        genres,
      };
    });
}

function urlToSlug(url: string) {
  const parts = url.split("/");

  return parts[parts.length - 2];
}

declare module "cheerio" {
  class Cheerio<T> {
    exists: (selector: string) => boolean;
  }
}
