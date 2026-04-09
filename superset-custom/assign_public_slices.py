from superset import create_app
app = create_app()
with app.app_context():
    from superset.extensions import db
    from superset.models.slice import Slice
    from superset.models.dashboard import Dashboard
    from flask_appbuilder.security.sqla.models import Role
    
    public_role = db.session.query(Role).filter_by(name="Public").first()
    dashboard = db.session.query(Dashboard).filter_by(id=2).first()
    
    print(f"Dashboard: {dashboard.dashboard_title}")
    print(f"Dashboard attributes: {dir(dashboard)}")
    
    # Try to get slices through JSON metadata
    import json
    position_json = json.loads(dashboard.position_json) if dashboard.position_json else {}
    slice_ids = []
    for key, value in position_json.items():
        if key.startswith("CHART-") and isinstance(value, dict):
            chart_id = value.get("meta", {}).get("chartId")
            if chart_id:
                slice_ids.append(chart_id)
    
    print(f"Slice IDs from position: {slice_ids}")
    
    count = 0
    for sid in slice_ids:
        sl = db.session.query(Slice).filter_by(id=sid).first()
        if sl:
            if public_role not in sl.roles:
                sl.roles.append(public_role)
                count += 1
                print(f"  Public -> {sl.slice_name}")
            else:
                print(f"  Already public -> {sl.slice_name}")
    
    db.session.commit()
    print(f"\nDone! Public role assigned to {count} slices")
