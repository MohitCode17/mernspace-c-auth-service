import { NextFunction, Request, Response } from "express";
import { TenantService } from "../services/TenantService";
import { CreateTenantRequest } from "../types";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";

export class TenantController {
  constructor(
    private tenantService: TenantService,
    private logger: Logger,
  ) {}

  async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
    // Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
      return;
    }

    // Getting tenant data from body
    const { name, address } = req.body;

    this.logger.debug("New request for creating a tenant", req.body);

    try {
      // Tenant creation query
      const tenant = await this.tenantService.create({ name, address });

      this.logger.info("Tenant has been created", { id: tenant.id });

      res.status(201).json({ id: tenant.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await this.tenantService.getAll();

      this.logger.info("All tenant have been fetched");

      res.json(tenants);
    } catch (err) {
      next(err);
      return;
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.params.id;

    if (isNaN(Number(tenantId))) {
      next(createHttpError(400, "Invalid url param."));
      return;
    }

    try {
      const tenant = await this.tenantService.getOne(Number(tenantId));

      this.logger.info(`Tenant with id ${tenantId} has been fetched`);

      res.json(tenant);
    } catch (err) {
      next(err);
      return;
    }
  }

  async update(req: CreateTenantRequest, res: Response, next: NextFunction) {
    // Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
      return;
    }

    const tenantId = req.params.id;
    const { name, address } = req.body;

    if (isNaN(Number(tenantId))) {
      next(createHttpError(400, "Invalid url param."));
      return;
    }

    this.logger.debug("Request for updating a tenant", req.body);

    try {
      await this.tenantService.update(Number(tenantId), { name, address });

      this.logger.info("Tenant has been updated", { id: tenantId });

      res.json({ id: Number(tenantId) });
    } catch (err) {
      next(err);
      return;
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.params.id;

    if (isNaN(Number(tenantId))) {
      next(createHttpError(400, "Invalid url param."));
      return;
    }

    this.logger.debug("Request for deleting a tenant", { id: tenantId });

    try {
      await this.tenantService.deleteById(Number(tenantId));

      this.logger.info("Tenant has been deleted", { id: tenantId });

      res.json({ id: Number(tenantId) });
    } catch (err) {
      next(err);
      return;
    }
  }
}
