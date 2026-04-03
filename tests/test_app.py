import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

# Helper to reset activities (since in-memory DB)
def reset_participants():
    for activity in activities.values():
        activity["participants"] = []

# Arrange-Act-Assert: GET /activities
def test_get_activities():
    # Arrange
    # (no setup needed)
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data

# Arrange-Act-Assert: POST /activities/{activity_name}/signup
@pytest.mark.parametrize("activity,email", [
    ("Chess Club", "test1@mergington.edu"),
    ("Programming Class", "test2@mergington.edu")
])
def test_signup_success(activity, email):
    # Arrange
    reset_participants()
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 200
    assert f"Signed up {email} for {activity}" in response.json()["message"]

# Doppia iscrizione
@pytest.mark.parametrize("activity,email", [
    ("Chess Club", "test3@mergington.edu")
])
def test_signup_duplicate(activity, email):
    # Arrange
    reset_participants()
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

# Attività non esistente
def test_signup_activity_not_found():
    # Arrange
    reset_participants()
    # Act
    response = client.post("/activities/NonExistent/signup?email=foo@mergington.edu")
    # Assert
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]

# Attività piena
def test_signup_activity_full():
    # Arrange
    reset_participants()
    activity = "Chess Club"
    # Riempi i posti
    for i in range(12):
        client.post(f"/activities/{activity}/signup?email=full{i}@mergington.edu")
    # Act
    response = client.post(f"/activities/{activity}/signup?email=extra@mergington.edu")
    # Assert
    assert response.status_code == 400
    assert "Activity full" in response.json()["detail"]

# DELETE /activities/{activity_name}/participants/{email}
def test_remove_participant_success():
    # Arrange
    reset_participants()
    activity = "Chess Club"
    email = "remove@mergington.edu"
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.delete(f"/activities/{activity}/participants/{email}")
    # Assert
    assert response.status_code == 204
    # Verifica che non sia più presente
    get_resp = client.get("/activities")
    assert email not in get_resp.json()[activity]["participants"]

# Rimozione di partecipante non iscritto
def test_remove_participant_not_found():
    # Arrange
    reset_participants()
    activity = "Chess Club"
    email = "notfound@mergington.edu"
    # Act
    response = client.delete(f"/activities/{activity}/participants/{email}")
    # Assert
    assert response.status_code == 404
    assert "Participant not found" in response.json()["detail"]

# Rimozione da attività non esistente
def test_remove_participant_activity_not_found():
    # Arrange
    reset_participants()
    # Act
    response = client.delete("/activities/NonExistent/participants/foo@mergington.edu")
    # Assert
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]
