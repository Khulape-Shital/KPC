export function getExecutiveStats(employees, executiveId) {

    const completedStatuses = [
        "completed",
        "approved",
        "rejected"
    ];

    const myCases = employees.filter(emp =>
        emp.assigned_to === executiveId
    );

    const completed = myCases.filter(emp =>
        completedStatuses.includes(
            (emp.status || "").toLowerCase()
        )
    );

    const today = new Date();

    // const completedToday = completed.filter(emp => {

    //     const d = new Date(emp.updated_at || emp.created_at);

    //     return d.toDateString() === today.toDateString();

    // });

    // const today = new Date();

    const completedToday = completed.filter(emp => {
        if (!emp.completed_at) return false;

        const d = new Date(emp.completed_at);
        const today = new Date();

        return (
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
        );
    }).length;


    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const completedWeek = completed.filter(emp => {
        if (!emp.completed_at) return false;
        return new Date(emp.completed_at) >= weekAgo;
    });

    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);

    const completedMonth = completed.filter(emp => {
        if (!emp.completed_at) return false;
        return new Date(emp.completed_at) >= monthAgo;
    });

    const slaSuccess =
        completed.length === 0
            ? 100
            : Math.round(
                completed.filter(emp => {

                    const start = new Date(emp.created_at || emp.createdDate);
                    const end = new Date(emp.completed_at);

                    const days =
                        (end - start) /
                        (1000 * 60 * 60 * 24);

                    return days <= 7;

                }).length /
                completed.length *
                100
            );

    return {

        totalCompleted: completed.length,

        completedToday: completedToday,

        completedWeek: completedWeek.length,

        completedMonth: completedMonth.length,

        slaSuccess

    };

}