//backend\internal\models\collection_point.go
package models

import (
	"context"
	"garbage_trucks/backend/internal/database"
)

type CollectionPoint struct {
	ID        int      `json:"id"`
	Name      string   `json:"name"`
	Address   string   `json:"address"`
	Latitude  float64  `json:"latitude"`
	Longitude float64  `json:"longitude"`
	City      string   `json:"city"`
	Drivers   []string `json:"drivers,omitempty"`
}

func GetAllPoints(ctx context.Context) ([]CollectionPoint, error) {
	rows, err := database.Pool.Query(ctx, `
		SELECT
			cp.id, 
			cp.name, 
			COALESCE(cp.address, ''), 
			cp.latitude, 
			cp.longitude, 
			cp.city,
			COALESCE(ARRAY_AGG(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL), ARRAY[]::text[]) as drivers
		FROM collection_points cp
		LEFT JOIN routes r ON cp.id = r.point_id
		LEFT JOIN drivers d ON r.driver_id = d.id
		GROUP BY cp.id, cp.name, cp.address, cp.latitude, cp.longitude, cp.city
		ORDER BY cp.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []CollectionPoint
	for rows.Next() {
		var p CollectionPoint
		var address string
		var drivers []string
		if err := rows.Scan(&p.ID, &p.Name, &address, &p.Latitude, &p.Longitude, &p.City, &drivers); err != nil {
			return nil, err
		}
		p.Address = address
		p.Drivers = drivers
		points = append(points, p)
	}
	return points, rows.Err()
}

func CreatePoint(ctx context.Context, name, address, city string, latitude, longitude float64) (*CollectionPoint, error) {
	var point CollectionPoint
	err := database.Pool.QueryRow(ctx, `
		INSERT INTO collection_points (name, address, latitude, longitude, city)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, address, latitude, longitude, city
	`, name, address, latitude, longitude, city).Scan(&point.ID, &point.Name, &point.Address, &point.Latitude, &point.Longitude, &point.City)
	if err != nil {
		return nil, err
	}
	return &point, nil
}

func CreatePointWithDrivers(ctx context.Context, name, address, city string, latitude, longitude float64, driverIDs []int) (*CollectionPoint, error) {
	point, err := CreatePoint(ctx, name, address, city, latitude, longitude)
	if err != nil {
		return nil, err
	}

	for _, driverID := range driverIDs {
		var maxOrder int
		err := database.Pool.QueryRow(ctx, `
			SELECT COALESCE(MAX(order_number), 0) FROM routes WHERE driver_id = $1
		`, driverID).Scan(&maxOrder)
		if err != nil {
			continue
		}

		_, err = database.Pool.Exec(ctx, `
			INSERT INTO routes (driver_id, point_id, order_number, scheduled_at, status)
			VALUES ($1, $2, $3, CURRENT_DATE + TIME '08:00:00' + (INTERVAL '10 minutes' * ($3 - 1)), 'pending')
		`, driverID, point.ID, maxOrder+1)
		if err != nil {
			continue
		}
	}
	return point, nil
}

func DeletePoint(ctx context.Context, id int) error {
	_, err := database.Pool.Exec(ctx, `DELETE FROM collection_points WHERE id = $1`, id)
	return err
}

func UpdatePoint(ctx context.Context, id int, name, address, city string, latitude, longitude float64) (*CollectionPoint, error) {
	var point CollectionPoint
	err := database.Pool.QueryRow(ctx, `
		UPDATE collection_points
		SET name = $1, address = $2, latitude = $3, longitude = $4, city = $5
		WHERE id = $6
		RETURNING id, name, address, latitude, longitude, city
	`, name, address, latitude, longitude, city, id).Scan(&point.ID, &point.Name, &point.Address, &point.Latitude, &point.Longitude, &point.City)
	if err != nil {
		return nil, err
	}
	return &point, nil
}

func UpdatePointWithDrivers(ctx context.Context, id int, name, address, city string, latitude, longitude float64, driverIDs []int) (*CollectionPoint, error) {
	point, err := UpdatePoint(ctx, id, name, address, city, latitude, longitude)
	if err != nil {
		return nil, err
	}

	_, err = database.Pool.Exec(ctx, `DELETE FROM routes WHERE point_id = $1`, id)
	if err != nil {
		return nil, err
	}

	for _, driverID := range driverIDs {
		var maxOrder int
		err := database.Pool.QueryRow(ctx, `
			SELECT COALESCE(MAX(order_number), 0) FROM routes WHERE driver_id = $1
		`, driverID).Scan(&maxOrder)
		if err != nil {
			continue
		}

		_, err = database.Pool.Exec(ctx, `
			INSERT INTO routes (driver_id, point_id, order_number, scheduled_at, status)
			VALUES ($1, $2, $3, CURRENT_DATE + TIME '08:00:00' + (INTERVAL '10 minutes' * ($3 - 1)), 'pending')
		`, driverID, point.ID, maxOrder+1)
		if err != nil {
			continue
		}
	}
	return point, nil
}