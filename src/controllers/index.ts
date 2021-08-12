import { NextFunction, Request, Response } from "express";
import {
  getInfo,
  getList,
  getSlide,
  getSource,
  getWatchInfo,
} from "../services";

export default class AnimeController {
  static async getSlide(_req: Request, res: Response, next: NextFunction) {
    const slideList = await getSlide();

    try {
      res.json({
        success: true,
        data: slideList,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTypeList(
    req: Request<{ slug: string }, unknown, unknown, { page: number }>,
    res: Response,
    next: NextFunction
  ) {
    const { page = 1 } = req.query;
    const { slug = "anime-moi" } = req.params;
    try {
      const list = await getList(slug, page);

      res.json({
        success: true,
        data: list.data,
        pagination: list.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSeasonList(
    req: Request<
      { season: string; year: string },
      unknown,
      unknown,
      { page: number }
    >,
    res: Response,
    next: NextFunction
  ) {
    const { page = 1 } = req.query;
    const { season = "winter", year = "2021" } = req.params;

    const prefix = "season";

    try {
      const list = await getList(`${prefix}/${season}/${year}`, page);

      res.json({
        success: true,
        data: list.data,
        pagination: list.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGenreList(
    req: Request<{ slug: string }, unknown, unknown, { page: number }>,
    res: Response,
    next: NextFunction
  ) {
    const { page = 1 } = req.query;
    const { slug = "hanh-dong" } = req.params;

    const prefix = "the-loai";

    try {
      const list = await getList(`${prefix}/${slug}`, page);

      res.json({
        success: true,
        data: list.data,
        pagination: list.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInfo(
    req: Request<{ slug: string }, unknown, unknown, unknown>,
    res: Response,
    next: NextFunction
  ) {
    const { slug } = req.params;

    try {
      const list = await getInfo(slug);

      res.json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWatchInfo(
    req: Request<{ slug: string }, unknown, unknown, unknown>,
    res: Response,
    next: NextFunction
  ) {
    const { slug } = req.params;

    try {
      const data = await getWatchInfo(slug);

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getSource(
    req: Request<unknown, unknown, unknown, { hash: string; id: number }>,
    res: Response,
    next: NextFunction
  ) {
    const { hash, id } = req.query;

    try {
      const data = await getSource(hash, id);

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
