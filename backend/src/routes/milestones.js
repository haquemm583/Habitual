/*
	milestones.js

	This script has the API routes for all milestone endpoints

	Created by: CJ Quintero
	Created on: 11/18/2026
*/

import { Router } from 'express'
import pool from '../db.js'
import { isMatch } from 'date-fns'

const router = Router()

function parseMilestoneId(rawId) {
	/*
		helper function to extract the milestone id
	*/

  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}


router.use((req, res, next) => {
	/* this middleware checks the request origin and if the user is logged in */

	// tell browser not to cache anything
  res.set('Cache-Control', 'no-store');

	/*
		block the origin if it is not a GET request, and contains an Origin header, 
		and isn't in the allowedOrigins list.
	*/
  const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'http://localhost:9000', 'http://localhost:3000'];
  if (req.method !== 'GET' && req.get('Origin') && !allowedOrigins.includes(req.get('Origin'))) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

	// check that the user is logged in by checking for their UID
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Login required.' });
  }

  next();
});


router.get('/', async (req, res, next) => {
	/*
		gets all milestones for the current user.
		this orders the milestones by closest deadlines first
		that haven't been completed, with the milestones with no
		target date listed last at the bottom
	*/

	try {
		const result = await pool.query(
			`
			SELECT *
			FROM milestones
			WHERE user_id = $1
			ORDER BY completed_on IS NOT NULL, target_date ASC NULLS LAST, id ASC
			`,
			[req.session.userId],
		)
		
		return res.json(result.rows);
	} catch (error) {
		next(error);
	}
})


router.get('/:id', async (req, res, next) => {
	/*
		get specific milestone by id
	*/

	// get the id
	const milestoneId = parseMilestoneId(req.params.id)
	if (!milestoneId) {
    return res.status(400).json({ error: 'Invalid milestone ID.' });
  }

	try {
		const result = await pool.query(
			`
			SELECT *
			FROM milestones
			WHERE id = $1
			AND user_id = $2
			`,
			[milestoneId, req.session.userId]
		)

		if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Milestone not found.' });
    }

		return res.json(result.rows[0])
	} catch (error) {
		next(error)
	}
})


router.post('/', async (req, res, next) => {
	/*
		creates a new milestone if valid or gives an error
		on bad input
	*/

	const { name, description, target_date } = req.body ?? {};

	// validate name
	if (typeof name !== 'string' || !name.trim() || name.trim().length > 200) {
    return res.status(400).json({ error: 'Milestone name must contain 1 to 200 characters.' });
  }

	// validate description - has to be a string, null, or undefined
	if (description !== undefined && description !== null && typeof description !== 'string') {
  	return res.status(400).json({ error: 'Description must be a string.' });
	}

	// validate target date - must be a string in yyyy-MM-dd format
	if (
		target_date != null &&
		(
			typeof target_date !== 'string' || 					// must be string
			!/^\d{4}-\d{2}-\d{2}$/.test(target_date) || // must be 4 digit year, 2 digit month, 2 digit day
			!isMatch(target_date, 'yyyy-MM-dd') 				// must be in yyyy-MM-dd format
		)
	) {
		return res.status(400).json({ error: 'Target date must be YYYY-MM-DD.' });
	}

	try {
		const result = await pool.query(
			`
			INSERT INTO milestones
			(user_id, name, description, target_date)
			VALUES ($1, $2, $3, $4)
			RETURNING *
			`,
			[
				req.session.userId,
				name.trim(),
				description?.trim() || null,
				target_date ?? null
			]
		)

		return res.status(201).json(result.rows[0]);
	} catch (error) {
		next(error)
	}
})

export default router
